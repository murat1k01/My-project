// Логика API ALTushki без привязки к Node.js: её запускает и HTTP-сервер (server/api.js),
// и встроенная SQL-база приложения на телефоне (src/api/local). Все проверки прав и данных выполняются здесь.

const SESSION_DAYS = 30;
const RESET_MINUTES = 15;
const RESET_ATTEMPTS = 5;
const MAX_BODY_BYTES = 3 * 1024 * 1024; // запас под фото профиля
const MAX_PHOTO_CHARS = 2_500_000;

export const LAUNDRY_SLOTS = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00'];
const LAUNDRY_DAYS_AHEAD = 7;

/** Цены — пример: платёжная система не подключена, поэтому оплатить их пока нельзя. */
export const PLANS = [
  { id: 'free', name: 'Free', price: 0, period: null, features: ['Все основные разделы ALTushki', 'До 5 избранных книг', '1 сохранённый маршрут и 1 остановка', '1 активная бронь стирки'] },
  { id: 'premium', name: 'Premium', price: 1500, period: 'месяц', features: ['Избранные книги без ограничений', 'Сохранённые маршруты и остановки без ограничений', 'До 2 активных броней стирки'] },
  { id: 'plus', name: 'Premium Plus', price: 2500, period: 'месяц', features: ['Всё, что входит в Premium', 'До 3 активных броней стирки'] },
];

/** Абонементы спорткомплекса: сроки нужны серверу, цены и описание показывает приложение. */
const MEMBERSHIP_DAYS = { single: 1, month: 30, semester: 120 };

const LIMITS = {
  free: { book: 5, route: 1, stop: 1, dish: null, bookings: 1 },
  premium: { book: null, route: null, stop: null, dish: null, bookings: 2 },
  plus: { book: null, route: null, stop: null, dish: null, bookings: 3 },
};

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const bad = (code, message) => new ApiError(400, code, message);

const nowIso = () => new Date().toISOString();
const addDays = (days) => new Date(Date.now() + days * 86_400_000).toISOString();
const clean = (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');
const camel = (row) => (row ? Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_(\w)/g, (_, c) => c.toUpperCase()), v])) : row);
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Разбирает логин: email или телефон Казахстана. */
function parseContact(value) {
  const text = clean(value).toLowerCase();
  if (EMAIL.test(text)) return { email: text, phone: null };
  let digits = text.replace(/[\s()+-]/g, '');
  if (/^\d{10,11}$/.test(digits)) {
    if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
    if (digits.length === 10) digits = `7${digits}`;
    if (/^7\d{10}$/.test(digits)) return { email: null, phone: digits };
  }
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) throw bad('weak_password', 'Пароль должен содержать не менее 8 символов');
  if (password.length > 128) throw bad('weak_password', 'Пароль слишком длинный (максимум 128 символов)');
  if (!/[A-Za-zА-Яа-яЁё]/.test(password) || !/\d/.test(password)) throw bad('weak_password', 'Пароль должен содержать буквы и цифры');
}

function profileFields(body) {
  const fields = {
    first_name: clean(body.firstName),
    last_name: clean(body.lastName),
    university: clean(body.university),
    faculty: clean(body.faculty),
    program: clean(body.program),
    group_name: clean(body.group).toUpperCase(),
  };
  const labels = { first_name: 'имя', last_name: 'фамилию', university: 'университет', faculty: 'факультет', program: 'специальность', group_name: 'учебную группу' };
  for (const [key, value] of Object.entries(fields)) {
    if (!value) throw bad('required', `Укажите ${labels[key]}`);
    if (value.length > 120) throw bad('too_long', `Поле «${labels[key]}» слишком длинное`);
  }
  const course = Number(body.course);
  if (!Number.isInteger(course) || course < 1 || course > 8) throw bad('required', 'Укажите курс от 1 до 8');
  return { ...fields, course };
}

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  phone: u.phone,
  firstName: u.first_name,
  lastName: u.last_name,
  university: u.university,
  faculty: u.faculty,
  program: u.program,
  group: u.group_name,
  course: u.course,
  photo: u.photo,
  showInDirectory: !!u.show_in_directory,
  showPhone: !!u.show_phone,
  role: u.role,
  createdAt: u.created_at,
});

/** Только то, что разрешено показывать другим студентам. */
const directoryUser = (u) => ({
  id: u.id,
  firstName: u.first_name,
  lastName: u.last_name,
  university: u.university,
  faculty: u.faculty,
  program: u.program,
  group: u.group_name,
  course: u.course,
  photo: u.photo,
  phone: u.show_phone ? u.phone : null,
});

/** Запись, которую добавил сам пользователь: её видит только он. */
const contactView = (c) => ({
  id: c.id,
  firstName: c.first_name,
  lastName: c.last_name,
  university: null,
  faculty: c.faculty,
  program: c.program,
  group: c.group_name,
  course: c.course,
  photo: null,
  phone: c.phone,
  addedByMe: true,
});

/** Ресурсы, которыми управляет администратор: только перечисленные поля можно изменять. */
const ADMIN_RESOURCES = {
  books: { table: 'books', pk: 'id', order: 'title', required: ['title', 'category'], fields: { title: 's', author: 's', year: 'i', category: 's', description: 's', isbn: 's', cover_url: 's', source_url: 's', read_url: 's', copies: 'i' } },
  menu: { table: 'menu_items', pk: 'id', order: 'category, name', required: ['name', 'price', 'category'], fields: { name: 's', description: 's', price: 'i', category: 's', available: 'b', allergens: 's', image_key: 's' } },
  pages: { table: 'info_pages', pk: 'slug', order: 'sort', required: ['slug', 'title', 'body'], fields: { slug: 's', title: 's', body: 's', sort: 'i', image_url: 's' } },
  dorms: { table: 'dorms', pk: 'id', order: 'name', required: ['name'], fields: { name: 's', address: 's', contacts: 's', services: 's', rules: 's', hours: 's' } },
  machines: { table: 'machines', pk: 'id', order: 'dorm_id, name', required: ['dorm_id', 'name'], fields: { dorm_id: 's', floor: 'i', name: 's', status: 's' } },
  catalog: { table: 'catalog', pk: 'id', order: 'kind, name', required: ['kind', 'name'], fields: { kind: 's', name: 's' } },
  rooms: { table: 'study_rooms', pk: 'id', order: 'building, name', required: ['name'], fields: { name: 's', building: 's', capacity: 'i', equipment: 's', image_key: 's' } },
};

export const STUDY_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];
const STUDY_DAYS_AHEAD = 14;
const STUDY_ACTIVE_LIMIT = 2;
const LISTING_KINDS = ['market', 'lost', 'found'];
const DOC_TYPES = ['enrollment', 'academic', 'transcript', 'grant', 'statement'];
const WALLET_PURPOSES = { food: 'Оплата столовой', dorm: 'Оплата общежития', tuition: 'Оплата обучения', transport: 'Транспортная карта' };

function readAdminFields(resource, body, partial) {
  const out = {};
  for (const [column, type] of Object.entries(resource.fields)) {
    const key = column.replace(/_(\w)/g, (_, c) => c.toUpperCase());
    if (!(key in body)) continue;
    const value = body[key];
    if (value === null || value === '') out[column] = null;
    else if (type === 's') out[column] = String(value).trim();
    else if (type === 'i') {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0) throw bad('invalid', `Поле ${key} должно быть целым неотрицательным числом`);
      out[column] = n;
    } else if (type === 'b') out[column] = value === true || value === 1 || value === 'true' ? 1 : 0;
  }
  if (!partial) for (const column of resource.required) if (out[column] === undefined || out[column] === null) throw bad('required', `Заполните поле ${column}`);
  return out;
}

/**
 * Создаёт обработчик запросов.
 * deps.security — хеши паролей и случайные токены, deps.transport — маршруты автобусов,
 * deps.hasCover(fileName) — есть ли обложка книги.
 */
export function createRouter(db, deps) {
  const { security, transport, hasCover = () => false, onResetCode = (contact, code) => console.log(`[восстановление пароля] ${contact}: код ${code} (действует ${RESET_MINUTES} мин)`), adminEmail = null, positionsUrl = null, fetchImpl = fetch } = deps;
  const { hashPassword, newId, newResetCode, newToken, sha256, verifyPassword } = security;
  const attempts = new Map();

  /** Обложка из папки проекта надёжнее внешнего сайта, который может быть недоступен из сети пользователя. */
  const coverName = (id) => `${id.replace(/[^\w-]/g, '_')}.jpg`;
  const bookView = (row) => {
    const book = camel(row);
    if (hasCover(coverName(book.id))) book.coverUrl = `/covers/${coverName(book.id)}`;
    return book;
  };

  /** Ограничение попыток входа и восстановления: 10 за 15 минут с одного адреса на один логин. */
  function throttle(key) {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.until < now) {
      attempts.set(key, { count: 1, until: now + 15 * 60_000 });
      return;
    }
    entry.count += 1;
    if (entry.count > 10) throw new ApiError(429, 'too_many_attempts', 'Слишком много попыток. Подождите 15 минут.');
  }

  const q = {
    userById: db.prepare('SELECT * FROM users WHERE id = ?'),
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    userByPhone: db.prepare('SELECT * FROM users WHERE phone = ?'),
  };
  const findByContact = (c) => (c.email ? q.userByEmail.get(c.email) : q.userByPhone.get(c.phone));

  function startSession(userId, days = SESSION_DAYS) {
    const token = newToken();
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').run(sha256(token), userId, addDays(days));
    return token;
  }

  function currentUser(token) {
    if (!token) return null;
    const row = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(sha256(token));
    if (!row) return null;
    if (row.expires_at < nowIso()) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
      return null;
    }
    return q.userById.get(row.user_id) ?? null;
  }

  function subscriptionOf(userId) {
    const row = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);
    if (!row) return { plan: 'free', status: 'none', expiresAt: null, previousPlan: null };
    if (row.expires_at <= nowIso()) return { plan: 'free', status: 'expired', expiresAt: row.expires_at, previousPlan: row.plan };
    return { plan: row.plan, status: row.canceled ? 'canceled' : 'active', expiresAt: row.expires_at, previousPlan: null };
  }
  const limitsOf = (userId) => LIMITS[subscriptionOf(userId).plan];

  function menuItem(row) {
    return { ...camel(row), available: !!row.available };
  }

  function orderView(row) {
    return { ...camel(row), lines: JSON.parse(row.lines) };
  }

  // ---------- Маршруты API: [метод, шаблон, обработчик, доступ] ----------
  const routes = [];
  const add = (method, path, handler, access = 'public') => {
    const keys = [];
    const regex = new RegExp(`^${path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
    routes.push({ method, regex, keys, handler, access });
  };

  add('GET', '/api/health', () => ({ ok: true }));

  // ---------- Авторизация ----------
  add('POST', '/api/auth/register', async ({ body }) => {
    const contact = parseContact(body.contact);
    if (!contact) throw bad('invalid_contact', 'Укажите корректный email или номер телефона');
    validatePassword(body.password);
    if (body.password !== body.passwordConfirm) throw bad('password_mismatch', 'Пароли не совпадают');
    const fields = profileFields(body);
    if (findByContact(contact)) throw new ApiError(409, 'contact_taken', 'Аккаунт с такими данными уже существует');
    const id = newId();
    const role = adminEmail && contact.email === adminEmail.toLowerCase() ? 'admin' : 'student';
    try {
      db.prepare(`INSERT INTO users (id, email, phone, password_hash, first_name, last_name, university, faculty, program, group_name, course, role, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, contact.email, contact.phone, await hashPassword(body.password), fields.first_name, fields.last_name, fields.university, fields.faculty, fields.program, fields.group_name, fields.course, role, nowIso());
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) throw new ApiError(409, 'contact_taken', 'Аккаунт с такими данными уже существует');
      throw error;
    }
    return { status: 201, data: { token: startSession(id), user: publicUser(q.userById.get(id)) } };
  });

  add('POST', '/api/auth/login', async ({ body, ip }) => {
    const contact = parseContact(body.contact);
    if (!contact || typeof body.password !== 'string') throw bad('invalid_credentials', 'Неверный логин или пароль');
    throttle(`login|${ip}|${contact.email ?? contact.phone}`);
    const user = findByContact(contact);
    // Одинаковый ответ для неверного логина и неверного пароля: нельзя узнать, кто зарегистрирован
    if (!user || !(await verifyPassword(body.password, user.password_hash))) throw new ApiError(401, 'invalid_credentials', 'Неверный логин или пароль');
    return { token: startSession(user.id, body.remember === false ? 1 : SESSION_DAYS), user: publicUser(user) };
  });

  add('POST', '/api/auth/logout', ({ token }) => {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    return { ok: true };
  }, 'user');

  add('POST', '/api/auth/forgot', ({ body, ip }) => {
    const contact = parseContact(body.contact);
    if (!contact) throw bad('invalid_contact', 'Укажите корректный email или номер телефона');
    throttle(`forgot|${ip}|${contact.email ?? contact.phone}`);
    const user = findByContact(contact);
    if (user) {
      const code = newResetCode();
      db.prepare(`INSERT INTO password_resets (user_id, code_hash, expires_at, attempts) VALUES (?,?,?,0)
        ON CONFLICT(user_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`)
        .run(user.id, sha256(`${user.id}|${code}`), new Date(Date.now() + RESET_MINUTES * 60_000).toISOString());
      onResetCode(contact.email ?? contact.phone, code);
    }
    return { ok: true };
  });

  add('POST', '/api/auth/reset', async ({ body }) => {
    const contact = parseContact(body.contact);
    const invalid = () => bad('invalid_code', 'Неверный или просроченный код');
    if (!contact) throw invalid();
    validatePassword(body.password);
    const user = findByContact(contact);
    const row = user && db.prepare('SELECT * FROM password_resets WHERE user_id = ?').get(user.id);
    if (!row || row.expires_at < nowIso() || row.attempts >= RESET_ATTEMPTS) throw invalid();
    if (row.code_hash !== sha256(`${user.id}|${clean(body.code)}`)) {
      db.prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = ?').run(user.id);
      throw invalid();
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(body.password), user.id);
    db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id); // старые входы больше не действуют
    return { ok: true };
  });

  // ---------- Профиль ----------
  add('GET', '/api/me', ({ user }) => ({ user: publicUser(user), subscription: subscriptionOf(user.id) }), 'user');

  add('PUT', '/api/me', ({ user, body }) => {
    const f = profileFields(body);
    let photo = user.photo;
    if (body.photo !== undefined) {
      if (body.photo === null) photo = null;
      else if (typeof body.photo === 'string' && body.photo.startsWith('data:image/') && body.photo.length <= MAX_PHOTO_CHARS) photo = body.photo;
      else throw bad('invalid_photo', 'Фото слишком большое или в неверном формате');
    }
    db.prepare(`UPDATE users SET first_name=?, last_name=?, university=?, faculty=?, program=?, group_name=?, course=?, photo=?, show_in_directory=?, show_phone=? WHERE id=?`)
      .run(f.first_name, f.last_name, f.university, f.faculty, f.program, f.group_name, f.course, photo, body.showInDirectory === false ? 0 : 1, body.showPhone === true ? 1 : 0, user.id);
    return { user: publicUser(q.userById.get(user.id)) };
  }, 'user');

  // ---------- Студенты (только вошедшим и только те, кто разрешил показ) ----------
  add('GET', '/api/students', ({ user, query }) => {
    const where = ['show_in_directory = 1', 'id <> ?'];
    const args = [user.id];
    for (const [param, column] of [['faculty', 'faculty'], ['program', 'program'], ['group', 'group_name']]) {
      if (query.get(param)) { where.push(`${column} = ?`); args.push(query.get(param)); }
    }
    if (query.get('course')) { where.push('course = ?'); args.push(Number(query.get('course'))); }
    const search = clean(query.get('q') ?? '').toLowerCase();
    let rows = db.prepare(`SELECT * FROM users WHERE ${where.join(' AND ')} ORDER BY last_name, first_name`).all(...args);
    const contacts = db.prepare('SELECT * FROM student_contacts WHERE owner_id = ? ORDER BY last_name, first_name').all(user.id);
    const matchesFilters = (c) => ['faculty', 'program'].every((k) => !query.get(k) || c[k] === query.get(k)) && (!query.get('group') || c.group_name === query.get('group')) && (!query.get('course') || c.course === Number(query.get('course')));
    let added = contacts.filter(matchesFilters);
    // Поиск на стороне JS: LOWER() в SQLite не понимает кириллицу
    const matchesSearch = (u) =>
      [`${u.first_name} ${u.last_name}`, `${u.last_name} ${u.first_name}`, u.group_name, u.program, u.faculty].some((v) => (v ?? '').toLowerCase().includes(search));
    if (search) {
      rows = rows.filter(matchesSearch);
      added = added.filter(matchesSearch);
    }
    const options = (column) => [...new Set([...db.prepare(`SELECT DISTINCT ${column} AS v FROM users WHERE show_in_directory = 1`).all().map((r) => r.v), ...contacts.map((c) => c[column])])].filter((v) => v !== null && v !== '').sort();
    return {
      students: [...added.map(contactView), ...rows.map(directoryUser)],
      filters: { faculty: options('faculty'), program: options('program'), group: options('group_name'), course: options('course') },
    };
  }, 'user');

  add('POST', '/api/students', ({ user, body }) => {
    const first = clean(body.firstName);
    const last = clean(body.lastName);
    if (!first) throw bad('required', 'Укажите имя');
    if (!last) throw bad('required', 'Укажите фамилию');
    let phone = null;
    if (clean(body.phone)) {
      const contact = parseContact(body.phone);
      if (!contact || contact.email) throw bad('invalid_contact', 'Укажите корректный номер телефона');
      phone = contact.phone;
    }
    const course = clean(String(body.course ?? '')) ? Number(body.course) : null;
    if (course !== null && (!Number.isInteger(course) || course < 1 || course > 8)) throw bad('required', 'Курс должен быть от 1 до 8');
    const id = newId();
    db.prepare('INSERT INTO student_contacts (id, owner_id, first_name, last_name, faculty, program, group_name, course, phone, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, user.id, first, last, clean(body.faculty) || null, clean(body.program) || null, clean(body.group).toUpperCase() || null, course, phone, nowIso());
    return { status: 201, data: { student: contactView(db.prepare('SELECT * FROM student_contacts WHERE id = ?').get(id)) } };
  }, 'user');

  add('DELETE', '/api/students/:id', ({ user, params }) => {
    // owner_id в условии: удалить можно только свою запись
    const result = db.prepare('DELETE FROM student_contacts WHERE id = ? AND owner_id = ?').run(params.id, user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Запись не найдена');
    return { ok: true };
  }, 'user');

  add('GET', '/api/students/:id', ({ user, params }) => {
    const contact = db.prepare('SELECT * FROM student_contacts WHERE id = ? AND owner_id = ?').get(params.id, user.id);
    if (contact) return { student: contactView(contact) };
    const student = q.userById.get(params.id);
    if (!student || !student.show_in_directory) throw new ApiError(404, 'not_found', 'Студент не найден или скрыл свой профиль');
    return { student: directoryUser(student) };
  }, 'user');

  add('GET', '/api/catalog', () => {
    const rows = db.prepare('SELECT kind, name FROM catalog ORDER BY name').all();
    const pick = (kind) => rows.filter((r) => r.kind === kind).map((r) => r.name);
    return { university: pick('university'), faculty: pick('faculty'), program: pick('program'), group: pick('group') };
  });

  // ---------- Библиотека ----------
  add('GET', '/api/books', ({ query }) => {
    const search = clean(query.get('q') ?? '').toLowerCase();
    const category = query.get('category');
    let rows = db.prepare('SELECT * FROM books').all();
    if (category) rows = rows.filter((b) => b.category === category);
    if (search) rows = rows.filter((b) => b.title.toLowerCase().includes(search) || (b.author ?? '').toLowerCase().includes(search));
    const sort = query.get('sort');
    if (sort === 'year') rows.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    else rows.sort((a, b) => a.title.localeCompare(b.title));
    const categories = db.prepare('SELECT DISTINCT category AS c FROM books ORDER BY c').all().map((r) => r.c);
    return { books: rows.map(bookView), categories };
  });

  add('GET', '/api/books/:id', ({ params }) => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(params.id);
    if (!book) throw new ApiError(404, 'not_found', 'Книга не найдена');
    return { book: bookView(book) };
  });

  // ---------- Избранное с проверкой лимита тарифа ----------
  const KINDS = ['book', 'dish', 'route', 'stop'];
  add('GET', '/api/favorites/:kind', ({ user, params }) => {
    if (!KINDS.includes(params.kind)) throw bad('invalid', 'Неизвестный тип');
    return { items: db.prepare('SELECT item_id AS id FROM user_items WHERE user_id = ? AND kind = ? ORDER BY created_at DESC').all(user.id, params.kind).map((r) => decodeURIComponent(r.id)), limit: limitsOf(user.id)[params.kind] };
  }, 'user');

  add('PUT', '/api/favorites/:kind/:id', ({ user, params }) => {
    if (!KINDS.includes(params.kind)) throw bad('invalid', 'Неизвестный тип');
    const limit = limitsOf(user.id)[params.kind];
    const count = db.prepare('SELECT COUNT(*) AS n FROM user_items WHERE user_id = ? AND kind = ?').get(user.id, params.kind).n;
    const exists = db.prepare('SELECT 1 FROM user_items WHERE user_id = ? AND kind = ? AND item_id = ?').get(user.id, params.kind, params.id);
    if (!exists && limit !== null && count >= limit) throw new ApiError(403, 'plan_limit', `На вашем тарифе можно сохранить не больше: ${limit}. Больше — с подпиской Premium.`);
    db.prepare('INSERT OR IGNORE INTO user_items (user_id, kind, item_id, created_at) VALUES (?,?,?,?)').run(user.id, params.kind, params.id, nowIso());
    return { ok: true };
  }, 'user');

  add('DELETE', '/api/favorites/:kind/:id', ({ user, params }) => {
    db.prepare('DELETE FROM user_items WHERE user_id = ? AND kind = ? AND item_id = ?').run(user.id, params.kind, params.id);
    return { ok: true };
  }, 'user');

  // ---------- Столовая ----------
  add('GET', '/api/menu', () => {
    const items = db.prepare('SELECT * FROM menu_items ORDER BY name').all().map(menuItem);
    return { items, categories: [...new Set(items.map((i) => i.category))] };
  });

  add('POST', '/api/orders', ({ user, body }) => {
    if (!Array.isArray(body.lines) || body.lines.length === 0) throw bad('empty_order', 'Корзина пуста');
    const delivery = body.delivery === 'delivery' ? 'delivery' : 'pickup';
    const address = clean(body.address);
    if (delivery === 'delivery' && address.length < 3) throw bad('address_required', 'Укажите адрес доставки');
    // Цены берём из базы, а не от приложения: подменить сумму на телефоне нельзя
    const lines = body.lines.map((line) => {
      const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(String(line.id));
      const qty = Number(line.qty);
      if (!item) throw bad('invalid_item', 'Одного из блюд больше нет в меню');
      if (!item.available) throw bad('unavailable', `Блюдо «${item.name}» сейчас недоступно`);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw bad('invalid_qty', 'Неверное количество');
      return { id: item.id, name: item.name, price: item.price, qty };
    });
    const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const number = db.prepare('SELECT COALESCE(MAX(number), 100) + 1 AS n FROM orders').get().n;
    const id = newId();
    const eta = new Date(Date.now() + (delivery === 'delivery' ? 30 : 15) * 60_000).toISOString();
    db.prepare('INSERT INTO orders (id, number, user_id, lines, total, delivery, address, eta_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, number, user.id, JSON.stringify(lines), total, delivery, delivery === 'delivery' ? address : null, eta, nowIso(), nowIso());
    return { status: 201, data: { order: orderView(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)) } };
  }, 'user');

  add('GET', '/api/orders', ({ user }) => ({ orders: db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(user.id).map(orderView) }), 'user');

  // ---------- Общежитие и стирка ----------
  add('GET', '/api/dorms', () => ({ dorms: db.prepare('SELECT * FROM dorms ORDER BY name').all().map(camel), slots: LAUNDRY_SLOTS }));
  add('GET', '/api/dorms/:id/machines', ({ params }) => ({ machines: db.prepare('SELECT * FROM machines WHERE dorm_id = ? ORDER BY floor, name').all(params.id).map(camel) }));

  function checkLaundryDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw bad('invalid_date', 'Неверная дата');
    const today = localDate();
    const last = localDate(new Date(Date.now() + LAUNDRY_DAYS_AHEAD * 86_400_000));
    if (date < today || date > last) throw bad('invalid_date', `Бронировать можно на ${LAUNDRY_DAYS_AHEAD} дней вперёд`);
  }

  add('GET', '/api/laundry/slots', ({ query, user }) => {
    const machineId = query.get('machine');
    const date = query.get('date');
    checkLaundryDate(date);
    const taken = db.prepare('SELECT slot, user_id FROM bookings WHERE machine_id = ? AND date = ? AND canceled = 0').all(machineId, date);
    const isPast = (slot) => new Date(`${date}T${slot}:00`) < new Date();
    return {
      slots: LAUNDRY_SLOTS.map((slot) => {
        const booking = taken.find((t) => t.slot === slot);
        return { slot, state: booking ? (booking.user_id === user.id ? 'mine' : 'busy') : isPast(slot) ? 'past' : 'free' };
      }),
    };
  }, 'user');

  add('POST', '/api/laundry/bookings', ({ user, body }) => {
    const { machineId, date, slot } = body;
    checkLaundryDate(date);
    if (!LAUNDRY_SLOTS.includes(slot)) throw bad('invalid_slot', 'Неверное время');
    if (new Date(`${date}T${slot}:00`) < new Date()) throw bad('slot_past', 'Это время уже прошло');
    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(String(machineId));
    if (!machine) throw new ApiError(404, 'not_found', 'Машина не найдена');
    if (machine.status !== 'ok') throw new ApiError(409, 'maintenance', 'Машина на обслуживании');
    const active = db.prepare(`SELECT COUNT(*) AS n FROM bookings WHERE user_id = ? AND canceled = 0 AND date >= ?`).get(user.id, localDate()).n;
    const limit = limitsOf(user.id).bookings;
    if (active >= limit) throw new ApiError(403, 'plan_limit', `Можно иметь не больше активных броней: ${limit}. Отмените одну из них или оформите Premium.`);
    const id = newId();
    try {
      db.prepare('INSERT INTO bookings (id, machine_id, user_id, date, slot, created_at) VALUES (?,?,?,?,?,?)').run(id, machine.id, user.id, date, slot, nowIso());
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) throw new ApiError(409, 'slot_taken', 'Это время только что заняли. Выберите другое.');
      throw error;
    }
    return { status: 201, data: { booking: { id, machineId: machine.id, date, slot } } };
  }, 'user');

  add('GET', '/api/laundry/bookings', ({ user }) => ({
    bookings: db.prepare(`SELECT b.id, b.date, b.slot, m.name AS machine, m.floor, d.name AS dorm FROM bookings b
      JOIN machines m ON m.id = b.machine_id JOIN dorms d ON d.id = m.dorm_id
      WHERE b.user_id = ? AND b.canceled = 0 AND b.date >= ? ORDER BY b.date, b.slot`).all(user.id, localDate()),
  }), 'user');

  add('DELETE', '/api/laundry/bookings/:id', ({ user, params }) => {
    // user_id в условии: отменить чужую бронь нельзя
    const result = db.prepare('UPDATE bookings SET canceled = 1 WHERE id = ? AND user_id = ?').run(params.id, user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Бронь не найдена');
    return { ok: true };
  }, 'user');

  // ---------- Заявки ----------
  const requestView = (row) => ({ ...camel(row), history: JSON.parse(row.history) });

  add('POST', '/api/requests', ({ user, body }) => {
    if (!['repair', 'response', 'application'].includes(body.kind)) throw bad('invalid', 'Неизвестный тип заявки');
    const text = clean(body.text);
    if (text.length < 5) throw bad('required', 'Напишите сообщение (не менее 5 символов)');
    if (text.length > 2000) throw bad('too_long', 'Сообщение слишком длинное');
    let target = null;
    if (body.kind !== 'repair') {
      const student = q.userById.get(String(body.targetUserId));
      if (!student || !student.show_in_directory) throw new ApiError(404, 'not_found', 'Студент не найден');
      target = student.id;
    }
    const id = newId();
    const now = nowIso();
    db.prepare('INSERT INTO requests (id, user_id, kind, category, target_user_id, text, history, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, user.id, body.kind, clean(body.category) || null, target, text, JSON.stringify([{ status: 'pending', at: now }]), now);
    return { status: 201, data: { request: requestView(db.prepare('SELECT * FROM requests WHERE id = ?').get(id)) } };
  }, 'user');

  add('GET', '/api/requests', ({ user }) => ({
    mine: db.prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC').all(user.id).map(requestView),
    incoming: db.prepare(`SELECT r.*, u.first_name AS from_first_name, u.last_name AS from_last_name FROM requests r
      JOIN users u ON u.id = r.user_id WHERE r.target_user_id = ? ORDER BY r.created_at DESC`).all(user.id).map(requestView),
  }), 'user');

  add('GET', '/api/admin/requests', () => ({
    items: db.prepare(`SELECT r.*, u.first_name AS from_first_name, u.last_name AS from_last_name FROM requests r
      JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC LIMIT 100`).all().map(requestView),
  }), 'admin');

  add('PATCH', '/api/admin/requests/:id', ({ params, body }) => {
    if (!['pending', 'decision', 'resolved'].includes(body.status)) throw bad('invalid', 'Неверный статус');
    const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(params.id);
    if (!row) throw new ApiError(404, 'not_found', 'Заявка не найдена');
    const history = [...JSON.parse(row.history), { status: body.status, at: nowIso() }];
    db.prepare('UPDATE requests SET status = ?, history = ? WHERE id = ?').run(body.status, JSON.stringify(history), params.id);
    return { ok: true };
  }, 'admin');

  // ---------- Транспорт ----------
  const routeSummary = ({ line, stops, ...rest }) => ({ ...rest, stopCount: stops.length, hasLine: line.length > 1 });

  add('GET', '/api/transport/routes', ({ query }) => {
    const search = clean(query.get('q') ?? '').toLowerCase();
    let list = transport.routes;
    if (search) list = list.filter((r) => r.number.toLowerCase().startsWith(search) || r.name.toLowerCase().includes(search) || (r.from ?? '').toLowerCase().includes(search) || (r.to ?? '').toLowerCase().includes(search));
    return { routes: list.map(routeSummary), source: transport.source, updatedAt: transport.osmTimestamp ?? transport.fetchedAt };
  });

  add('GET', '/api/transport/routes/:id', ({ params }) => {
    const route = transport.routes.find((r) => r.id === params.id);
    if (!route) throw new ApiError(404, 'not_found', 'Маршрут не найден');
    return { route, source: transport.source, updatedAt: transport.osmTimestamp ?? transport.fetchedAt };
  });

  add('GET', '/api/transport/stops', ({ query }) => {
    const search = clean(query.get('q') ?? '').toLowerCase();
    if (search.length < 2) return { stops: [] };
    const found = new Map();
    for (const route of transport.routes) {
      for (const stop of route.stops) {
        if (!stop.name.toLowerCase().includes(search)) continue;
        const entry = found.get(stop.name) ?? { ...stop, routes: [] };
        if (!entry.routes.some((r) => r.number === route.number)) entry.routes.push({ id: route.id, number: route.number });
        found.set(stop.name, entry);
      }
    }
    return { stops: [...found.values()].slice(0, 30) };
  });

  // Реальные координаты автобусов — только из настоящего источника (BUS_POSITIONS_URL). Без него честно отвечаем «нет данных».
  add('GET', '/api/transport/vehicles', async ({ query }) => {
    if (!positionsUrl) return { available: false, vehicles: [], reason: 'not_configured' };
    try {
      const res = await fetchImpl(positionsUrl);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const number = query.get('route');
      const vehicles = (Array.isArray(data) ? data : data.vehicles ?? [])
        .filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lon) && (!number || String(v.routeNumber) === number));
      return { available: true, vehicles, updatedAt: nowIso() };
    } catch {
      return { available: false, vehicles: [], reason: 'source_unavailable' };
    }
  });

  // ---------- Информация ----------
  add('GET', '/api/info', ({ query }) => {
    const search = clean(query.get('q') ?? '').toLowerCase();
    let rows = db.prepare('SELECT * FROM info_pages ORDER BY sort').all();
    if (search) rows = rows.filter((p) => p.title.toLowerCase().includes(search) || p.body.toLowerCase().includes(search));
    return { pages: rows.map(camel) };
  });

  // ---------- Подписка ----------
  add('GET', '/api/plans', () => ({ plans: PLANS, paymentsEnabled: false, testMode: true }));
  add('GET', '/api/subscription', ({ user }) => ({ subscription: subscriptionOf(user.id) }), 'user');

  // Настоящая платёжная система не подключена. Оформление возможно только в тестовом режиме
  // с привязанной тестовой картой: деньги не списываются, и ответ прямо говорит об этом (charged: 0).
  add('POST', '/api/subscription/checkout', ({ user, body }) => {
    const plan = PLANS.find((p) => p.id === body.plan && p.price > 0);
    if (!plan) throw bad('invalid_plan', 'Неизвестный тариф');
    if (body.mode !== 'test') throw new ApiError(501, 'payments_not_configured', 'Оплата пока не подключена. Деньги не списаны, подписка не оформлена.');
    const card = db.prepare('SELECT id, last4 FROM payment_methods WHERE id = ? AND user_id = ?').get(String(body.paymentMethodId ?? ''), user.id);
    if (!card) throw bad('card_required', 'Сначала привяжите тестовую карту в разделе «Оплата через Visa»');
    db.prepare(`INSERT INTO subscriptions (user_id, plan, canceled, started_at, expires_at) VALUES (?,?,0,?,?)
      ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, canceled = 0, started_at = excluded.started_at, expires_at = excluded.expires_at`)
      .run(user.id, plan.id, nowIso(), addDays(30));
    return { subscription: subscriptionOf(user.id), test: true, charged: 0, card: card.last4 };
  }, 'user');

  add('POST', '/api/subscription/cancel', ({ user }) => {
    const result = db.prepare('UPDATE subscriptions SET canceled = 1 WHERE user_id = ?').run(user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Активной подписки нет');
    return { subscription: subscriptionOf(user.id) };
  }, 'user');

  // ---------- Оплата через Visa: тестовая привязка карты ----------
  // Платёжный провайдер не подключён, поэтому привязка учебная: деньги не списываются.
  // Сервер хранит только последние 4 цифры, срок и имя. Полный номер и CVV он не принимает.
  add('GET', '/api/payment-methods', ({ user }) => ({
    cards: db.prepare('SELECT id, brand, last4, exp_month, exp_year, holder FROM payment_methods WHERE user_id = ? ORDER BY created_at DESC').all(user.id).map(camel),
  }), 'user');

  add('POST', '/api/payment-methods', ({ user, body }) => {
    if (['cardNumber', 'number', 'cvv', 'cvc', 'pan'].some((key) => key in body)) throw bad('raw_card', 'Полный номер карты и CVV нельзя отправлять на сервер приложения');
    if (body.mode !== 'test') throw bad('invalid', 'Сейчас доступна только тестовая привязка карты');
    const holder = clean(body.holder).toUpperCase();
    if (!/^\d{4}$/.test(String(body.last4)) || !/^\d{2}$/.test(String(body.expMonth)) || !/^\d{4}$/.test(String(body.expYear)) || holder.length < 3) throw bad('invalid', 'Проверьте данные карты');
    const count = db.prepare('SELECT COUNT(*) AS n FROM payment_methods WHERE user_id = ?').get(user.id).n;
    if (count >= 5) throw bad('too_many_cards', 'Можно привязать не больше 5 карт');
    db.prepare('INSERT INTO payment_methods (id, user_id, provider, token, brand, last4, exp_month, exp_year, holder, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(newId(), user.id, 'test', `test_${newId()}`, 'test', String(body.last4), String(body.expMonth), String(body.expYear), holder, nowIso());
    return { status: 201, data: { ok: true } };
  }, 'user');

  add('DELETE', '/api/payment-methods/:id', ({ user, params }) => {
    const result = db.prepare('DELETE FROM payment_methods WHERE id = ? AND user_id = ?').run(params.id, user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Карта не найдена');
    return { ok: true };
  }, 'user');

  // ---------- Сообщения студентам ----------
  const MESSAGE_MAX = 1000;
  const messageView = (row, me) => ({ id: row.id, text: row.text, createdAt: row.created_at, mine: row.from_id === me, read: !!row.read_at });

  add('GET', '/api/messages', ({ user }) => {
    const rows = db.prepare(`SELECT m.*, CASE WHEN m.from_id = ? THEN m.to_id ELSE m.from_id END AS other_id FROM messages m
      WHERE m.from_id = ? OR m.to_id = ? ORDER BY m.created_at DESC`).all(user.id, user.id, user.id);
    const chats = new Map();
    for (const row of rows) {
      const chat = chats.get(row.other_id) ?? { userId: row.other_id, last: messageView(row, user.id), unread: 0 };
      if (row.to_id === user.id && !row.read_at) chat.unread += 1;
      chats.set(row.other_id, chat);
    }
    const list = [...chats.values()].map((chat) => {
      const other = q.userById.get(chat.userId);
      return other ? { ...chat, firstName: other.first_name, lastName: other.last_name, photo: other.photo } : null;
    }).filter(Boolean);
    return { chats: list };
  }, 'user');

  add('GET', '/api/messages/:userId', ({ user, params }) => {
    const other = q.userById.get(params.userId);
    if (!other) throw new ApiError(404, 'not_found', 'Студент не найден');
    db.prepare('UPDATE messages SET read_at = ? WHERE from_id = ? AND to_id = ? AND read_at IS NULL').run(nowIso(), other.id, user.id);
    const rows = db.prepare(`SELECT * FROM messages WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
      ORDER BY created_at LIMIT 500`).all(user.id, other.id, other.id, user.id);
    return { user: { id: other.id, firstName: other.first_name, lastName: other.last_name, photo: other.photo }, messages: rows.map((r) => messageView(r, user.id)) };
  }, 'user');

  add('POST', '/api/messages/:userId', ({ user, params, body }) => {
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) throw bad('required', 'Напишите сообщение');
    if (text.length > MESSAGE_MAX) throw bad('too_long', 'Сообщение слишком длинное');
    const other = q.userById.get(params.userId);
    if (!other || other.id === user.id) throw new ApiError(404, 'not_found', 'Студент не найден');
    // Написать первым можно только тому, кто показан в списке студентов; ответить — всегда
    const replied = db.prepare('SELECT 1 FROM messages WHERE from_id = ? AND to_id = ? LIMIT 1').get(other.id, user.id);
    const hasListing = db.prepare("SELECT 1 FROM listings WHERE user_id = ? AND status = 'active' LIMIT 1").get(other.id);
    if (!other.show_in_directory && !replied && !hasListing) throw new ApiError(404, 'not_found', 'Студент не найден');
    const id = newId();
    db.prepare('INSERT INTO messages (id, from_id, to_id, text, created_at) VALUES (?,?,?,?,?)').run(id, user.id, other.id, text, nowIso());
    return { status: 201, data: { message: messageView(db.prepare('SELECT * FROM messages WHERE id = ?').get(id), user.id) } };
  }, 'user');

  // ---------- Объявления: маркетплейс и бюро находок ----------
  const listingView = (row, me) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    category: row.category,
    price: row.price,
    place: row.place,
    eventDate: row.event_date,
    photo: row.photo,
    status: row.status,
    createdAt: row.created_at,
    ownerId: row.user_id,
    ownerName: row.first_name ? `${row.first_name} ${row.last_name}` : null,
    mine: row.user_id === me,
  });

  add('GET', '/api/listings', ({ user, query }) => {
    const kind = query.get('kind');
    if (!LISTING_KINDS.includes(kind)) throw bad('invalid', 'Неизвестный тип объявлений');
    const search = clean(query.get('q') || '').toLowerCase();
    const rows = db.prepare(`SELECT l.*, u.first_name, u.last_name FROM listings l JOIN users u ON u.id = l.user_id
      WHERE l.kind = ? AND (l.status = 'active' OR l.user_id = ?) ORDER BY l.created_at DESC LIMIT 200`).all(kind, user.id);
    const list = rows.filter((r) => !search || `${r.title} ${r.description ?? ''} ${r.category ?? ''} ${r.place ?? ''}`.toLowerCase().includes(search));
    return { listings: list.map((r) => listingView(r, user.id)) };
  }, 'user');

  add('POST', '/api/listings', ({ user, body }) => {
    if (!LISTING_KINDS.includes(body.kind)) throw bad('invalid', 'Неизвестный тип объявления');
    const title = clean(body.title);
    if (title.length < 3 || title.length > 80) throw bad('required', 'Название — от 3 до 80 символов');
    const description = clean(body.description);
    if (description.length > 1000) throw bad('too_long', 'Описание слишком длинное');
    let price = null;
    if (body.kind === 'market') {
      price = Number(body.price);
      if (!Number.isInteger(price) || price < 0 || price > 10_000_000) throw bad('invalid_price', 'Укажите цену в тенге целым числом');
    }
    const eventDate = body.eventDate ? String(body.eventDate) : null;
    if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw bad('invalid_date', 'Неверная дата');
    let photo = null;
    if (body.photo) {
      if (typeof body.photo !== 'string' || !body.photo.startsWith('data:image/') || body.photo.length > MAX_PHOTO_CHARS) throw bad('invalid_photo', 'Фото слишком большое или в неверном формате');
      photo = body.photo;
    }
    const active = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE user_id = ? AND status = 'active'").get(user.id).n;
    if (active >= 20) throw new ApiError(403, 'limit', 'Не больше 20 активных объявлений');
    const id = newId();
    db.prepare('INSERT INTO listings (id, user_id, kind, title, description, category, price, place, event_date, photo, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, user.id, body.kind, title, description || null, clean(body.category) || null, price, clean(body.place) || null, eventDate, photo, nowIso());
    const row = db.prepare('SELECT l.*, u.first_name, u.last_name FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ?').get(id);
    return { status: 201, data: { listing: listingView(row, user.id) } };
  }, 'user');

  add('PATCH', '/api/listings/:id', ({ user, params, body }) => {
    if (!['active', 'closed'].includes(body.status)) throw bad('invalid', 'Неверный статус');
    const result = db.prepare('UPDATE listings SET status = ? WHERE id = ? AND user_id = ?').run(body.status, params.id, user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Объявление не найдено');
    return { ok: true };
  }, 'user');

  add('DELETE', '/api/listings/:id', ({ user, params }) => {
    // Удалить может автор или администратор (модерация)
    const row = db.prepare('SELECT user_id FROM listings WHERE id = ?').get(params.id);
    if (!row || (row.user_id !== user.id && user.role !== 'admin')) throw new ApiError(404, 'not_found', 'Объявление не найдено');
    db.prepare('DELETE FROM listings WHERE id = ?').run(params.id);
    return { ok: true };
  }, 'user');

  add('POST', '/api/listings/:id/report', ({ user, params }) => {
    const result = db.prepare('UPDATE listings SET reports = reports + 1 WHERE id = ? AND user_id <> ?').run(params.id, user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Объявление не найдено');
    return { ok: true };
  }, 'user');

  add('GET', '/api/admin/listings', () => ({
    items: db.prepare('SELECT l.*, u.first_name, u.last_name FROM listings l JOIN users u ON u.id = l.user_id WHERE l.reports > 0 ORDER BY l.reports DESC LIMIT 100').all().map((r) => ({ ...listingView(r, null), reports: r.reports })),
  }), 'admin');

  // ---------- Учебные комнаты ----------
  const checkStudyDate = (date) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw bad('invalid_date', 'Неверная дата');
    const last = localDate(new Date(Date.now() + STUDY_DAYS_AHEAD * 86_400_000));
    if (date < localDate() || date > last) throw bad('invalid_date', `Бронировать можно на ${STUDY_DAYS_AHEAD} дней вперёд`);
  };

  add('GET', '/api/study-rooms', () => ({ rooms: db.prepare('SELECT * FROM study_rooms ORDER BY building, name').all().map(camel), slots: STUDY_SLOTS }), 'user');

  add('GET', '/api/study-rooms/:id/slots', ({ user, params, query }) => {
    const date = query.get('date');
    checkStudyDate(date);
    const taken = db.prepare('SELECT slot, user_id FROM study_bookings WHERE room_id = ? AND date = ? AND canceled = 0').all(params.id, date);
    return {
      slots: STUDY_SLOTS.map((slot) => {
        const booking = taken.find((t) => t.slot === slot);
        const past = new Date(`${date}T${slot}:00`) < new Date();
        return { slot, state: booking ? (booking.user_id === user.id ? 'mine' : 'busy') : past ? 'past' : 'free' };
      }),
    };
  }, 'user');

  add('POST', '/api/study-bookings', ({ user, body }) => {
    const { roomId, date, slot } = body;
    checkStudyDate(date);
    if (!STUDY_SLOTS.includes(slot)) throw bad('invalid_slot', 'Неверное время');
    if (new Date(`${date}T${slot}:00`) < new Date()) throw bad('slot_past', 'Это время уже прошло');
    const room = db.prepare('SELECT * FROM study_rooms WHERE id = ?').get(String(roomId));
    if (!room) throw new ApiError(404, 'not_found', 'Комната не найдена');
    const active = db.prepare('SELECT COUNT(*) AS n FROM study_bookings WHERE user_id = ? AND canceled = 0 AND date >= ?').get(user.id, localDate()).n;
    if (active >= STUDY_ACTIVE_LIMIT) throw new ApiError(403, 'limit', `Можно иметь не больше ${STUDY_ACTIVE_LIMIT} активных броней комнат`);
    const id = newId();
    try {
      db.prepare('INSERT INTO study_bookings (id, room_id, user_id, date, slot, created_at) VALUES (?,?,?,?,?,?)').run(id, room.id, user.id, date, slot, nowIso());
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) throw new ApiError(409, 'slot_taken', 'Это время только что заняли. Выберите другое.');
      throw error;
    }
    return { status: 201, data: { booking: { id, roomId: room.id, date, slot } } };
  }, 'user');

  add('GET', '/api/study-bookings', ({ user }) => ({
    bookings: db.prepare(`SELECT b.id, b.date, b.slot, r.name AS room, r.building FROM study_bookings b JOIN study_rooms r ON r.id = b.room_id
      WHERE b.user_id = ? AND b.canceled = 0 AND b.date >= ? ORDER BY b.date, b.slot`).all(user.id, localDate()),
  }), 'user');

  add('DELETE', '/api/study-bookings/:id', ({ user, params }) => {
    const result = db.prepare('UPDATE study_bookings SET canceled = 1 WHERE id = ? AND user_id = ?').run(params.id, user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Бронь не найдена');
    return { ok: true };
  }, 'user');

  // ---------- ALT Wallet: только тестовый режим ----------
  const walletOf = (userId) => {
    const transactions = db.prepare('SELECT id, type, amount, title, created_at AS createdAt FROM wallet_tx WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(userId);
    const balance = db.prepare("SELECT COALESCE(SUM(CASE WHEN type = 'topup' THEN amount ELSE -amount END), 0) AS b FROM wallet_tx WHERE user_id = ?").get(userId).b;
    return { balance, testMode: true, transactions };
  };

  add('GET', '/api/wallet', ({ user }) => walletOf(user.id), 'user');

  add('POST', '/api/wallet/topup', ({ user, body }) => {
    // Платёжный провайдер не подключён: пополнение возможно только явно в тестовом режиме, деньги не списываются
    if (body.mode !== 'test') throw new ApiError(501, 'payments_not_configured', 'Платёжная система не подключена. Доступно только тестовое пополнение.');
    const card = db.prepare('SELECT id, last4 FROM payment_methods WHERE id = ? AND user_id = ?').get(String(body.paymentMethodId ?? ''), user.id);
    if (!card) throw bad('no_card', 'Выберите привязанную карту');
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount < 100 || amount > 200_000) throw bad('invalid_amount', 'Сумма — от 100 до 200 000 ₸');
    db.prepare('INSERT INTO wallet_tx (id, user_id, type, amount, title, created_at) VALUES (?,?,?,?,?,?)').run(newId(), user.id, 'topup', amount, `Тестовое пополнение · карта •• ${card.last4}`, nowIso());
    return walletOf(user.id);
  }, 'user');

  add('POST', '/api/wallet/pay', ({ user, body }) => {
    if (body.mode !== 'test') throw new ApiError(501, 'payments_not_configured', 'Платёжная система не подключена. Доступна только тестовая оплата.');
    const title = WALLET_PURPOSES[body.purpose];
    if (!title) throw bad('invalid', 'Неизвестный платёж');
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 2_000_000) throw bad('invalid_amount', 'Неверная сумма');
    if (walletOf(user.id).balance < amount) throw new ApiError(409, 'insufficient', 'Недостаточно средств на тестовом балансе');
    db.prepare('INSERT INTO wallet_tx (id, user_id, type, amount, title, created_at) VALUES (?,?,?,?,?,?)').run(newId(), user.id, 'payment', amount, `${title} (тест)`, nowIso());
    return walletOf(user.id);
  }, 'user');

  // ---------- ALT Documents: запросы справок ----------
  const docView = (row) => ({ id: row.id, docType: row.doc_type, comment: row.comment, status: row.status, history: JSON.parse(row.history), createdAt: row.created_at });

  add('GET', '/api/documents', ({ user }) => ({ requests: db.prepare('SELECT * FROM doc_requests WHERE user_id = ? ORDER BY created_at DESC').all(user.id).map(docView) }), 'user');

  add('POST', '/api/documents', ({ user, body }) => {
    if (!DOC_TYPES.includes(body.docType)) throw bad('invalid', 'Неизвестный документ');
    const comment = clean(body.comment);
    if (comment.length > 1000) throw bad('too_long', 'Комментарий слишком длинный');
    if (body.docType === 'statement' && comment.length < 5) throw bad('required', 'Опишите заявление (не менее 5 символов)');
    const pending = db.prepare("SELECT COUNT(*) AS n FROM doc_requests WHERE user_id = ? AND status = 'pending'").get(user.id).n;
    if (pending >= 10) throw new ApiError(403, 'limit', 'Не больше 10 запросов в обработке');
    const id = newId();
    const now = nowIso();
    db.prepare('INSERT INTO doc_requests (id, user_id, doc_type, comment, history, created_at) VALUES (?,?,?,?,?,?)').run(id, user.id, body.docType, comment || null, JSON.stringify([{ status: 'pending', at: now }]), now);
    return { status: 201, data: { request: docView(db.prepare('SELECT * FROM doc_requests WHERE id = ?').get(id)) } };
  }, 'user');

  add('GET', '/api/admin/documents', () => ({
    items: db.prepare(`SELECT d.*, u.first_name, u.last_name, u.group_name FROM doc_requests d JOIN users u ON u.id = d.user_id ORDER BY d.created_at DESC LIMIT 100`).all().map((r) => ({ ...docView(r), fromFirstName: r.first_name, fromLastName: r.last_name, group: r.group_name })),
  }), 'admin');

  add('PATCH', '/api/admin/documents/:id', ({ params, body }) => {
    if (!['pending', 'ready', 'rejected'].includes(body.status)) throw bad('invalid', 'Неверный статус');
    const row = db.prepare('SELECT * FROM doc_requests WHERE id = ?').get(params.id);
    if (!row) throw new ApiError(404, 'not_found', 'Запрос не найден');
    const history = [...JSON.parse(row.history), { status: body.status, at: nowIso() }];
    db.prepare('UPDATE doc_requests SET status = ?, history = ? WHERE id = ?').run(body.status, JSON.stringify(history), params.id);
    return { ok: true };
  }, 'admin');

  // ---------- Задачи (планировщик помощника ALT AI) ----------
  const todoView = (row) => ({ id: row.id, title: row.title, dueDate: row.due_date, done: !!row.done, createdAt: row.created_at });
  const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

  add('GET', '/api/todos', ({ user }) => ({
    items: db.prepare('SELECT * FROM todo_items WHERE user_id = ? ORDER BY done, due_date IS NULL, due_date, created_at').all(user.id).map(todoView),
  }), 'user');

  add('POST', '/api/todos', ({ user, body }) => {
    const title = clean(body.title);
    if (title.length < 2) throw bad('required', 'Опишите задачу');
    if (title.length > 200) throw bad('too_long', 'Задача слишком длинная');
    const due = body.dueDate ? String(body.dueDate) : null;
    if (due && !DATE_KEY.test(due)) throw bad('invalid', 'Дата в формате ГГГГ-ММ-ДД');
    const count = db.prepare('SELECT COUNT(*) AS n FROM todo_items WHERE user_id = ? AND done = 0').get(user.id).n;
    if (count >= 200) throw bad('too_many', 'Слишком много открытых задач');
    const id = newId();
    db.prepare('INSERT INTO todo_items (id, user_id, title, due_date, created_at) VALUES (?,?,?,?,?)').run(id, user.id, title, due, nowIso());
    return { status: 201, data: { item: todoView(db.prepare('SELECT * FROM todo_items WHERE id = ?').get(id)) } };
  }, 'user');

  add('PATCH', '/api/todos/:id', ({ user, params, body }) => {
    const row = db.prepare('SELECT * FROM todo_items WHERE id = ? AND user_id = ?').get(params.id, user.id);
    if (!row) throw new ApiError(404, 'not_found', 'Задача не найдена');
    const due = 'dueDate' in body ? (body.dueDate ? String(body.dueDate) : null) : row.due_date;
    if (due && !DATE_KEY.test(due)) throw bad('invalid', 'Дата в формате ГГГГ-ММ-ДД');
    const done = 'done' in body ? (body.done ? 1 : 0) : row.done;
    db.prepare('UPDATE todo_items SET due_date = ?, done = ? WHERE id = ?').run(due, done, row.id);
    return { item: todoView(db.prepare('SELECT * FROM todo_items WHERE id = ?').get(row.id)) };
  }, 'user');

  add('DELETE', '/api/todos/:id', ({ user, params }) => {
    const result = db.prepare('DELETE FROM todo_items WHERE id = ? AND user_id = ?').run(params.id, user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Задача не найдена');
    return { ok: true };
  }, 'user');

  // ---------- Абонемент спорткомплекса ----------
  // Оплата проходит на месте, поэтому заявку подтверждает администратор: онлайн деньги не списываются.
  const membershipOf = (userId) => {
    const row = db.prepare("SELECT * FROM memberships WHERE user_id = ? AND status <> 'canceled' ORDER BY created_at DESC LIMIT 1").get(userId);
    if (!row || (row.status === 'active' && row.expires_at <= nowIso())) return null;
    return camel(row);
  };

  add('GET', '/api/membership', ({ user }) => ({ membership: membershipOf(user.id) }), 'user');

  // История всех заявок на абонемент, включая отменённые
  add('GET', '/api/membership/history', ({ user }) => ({
    items: db.prepare('SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(user.id).map(camel),
  }), 'user');

  add('POST', '/api/membership', ({ user, body }) => {
    if (!MEMBERSHIP_DAYS[body.planId]) throw bad('invalid_plan', 'Неизвестный абонемент');
    if (membershipOf(user.id)) throw new ApiError(409, 'membership_exists', 'У вас уже есть абонемент или заявка на него');
    db.prepare('INSERT INTO memberships (id, user_id, plan_id, created_at) VALUES (?,?,?,?)').run(newId(), user.id, body.planId, nowIso());
    return { status: 201, data: { membership: membershipOf(user.id) } };
  }, 'user');

  add('DELETE', '/api/membership', ({ user }) => {
    const result = db.prepare("UPDATE memberships SET status = 'canceled' WHERE user_id = ? AND status <> 'canceled'").run(user.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Абонемента нет');
    return { ok: true };
  }, 'user');

  add('GET', '/api/admin/memberships', () => ({
    items: db.prepare(`SELECT m.*, u.first_name AS first_name, u.last_name AS last_name FROM memberships m
      JOIN users u ON u.id = m.user_id ORDER BY m.created_at DESC LIMIT 100`).all().map(camel),
  }), 'admin');

  add('PATCH', '/api/admin/memberships/:id', ({ params, body }) => {
    const row = db.prepare('SELECT * FROM memberships WHERE id = ?').get(params.id);
    if (!row) throw new ApiError(404, 'not_found', 'Заявка не найдена');
    if (!['active', 'canceled'].includes(body.status)) throw bad('invalid', 'Неверный статус');
    const expires = body.status === 'active' ? addDays(MEMBERSHIP_DAYS[row.plan_id]) : null;
    db.prepare('UPDATE memberships SET status = ?, expires_at = ? WHERE id = ?').run(body.status, expires, params.id);
    return { ok: true };
  }, 'admin');

  // ---------- Администрирование ----------
  const resourceOf = (name) => {
    const resource = ADMIN_RESOURCES[name];
    if (!resource) throw new ApiError(404, 'not_found', 'Неизвестный раздел');
    return resource;
  };

  add('GET', '/api/admin/orders', () => ({ orders: db.prepare(`SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 100`).all().map(orderView) }), 'admin');

  add('PATCH', '/api/admin/orders/:id', ({ params, body }) => {
    if (!['new', 'cooking', 'ready', 'delivering', 'done', 'canceled'].includes(body.status)) throw bad('invalid', 'Неверный статус');
    const result = db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(body.status, nowIso(), params.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Заказ не найден');
    return { ok: true };
  }, 'admin');

  add('GET', '/api/admin/bookings', () => ({
    bookings: db.prepare(`SELECT b.id, b.date, b.slot, m.name AS machine, d.name AS dorm, u.first_name AS firstName, u.last_name AS lastName FROM bookings b
      JOIN machines m ON m.id = b.machine_id JOIN dorms d ON d.id = m.dorm_id JOIN users u ON u.id = b.user_id
      WHERE b.canceled = 0 AND b.date >= ? ORDER BY b.date, b.slot`).all(localDate()),
  }), 'admin');

  // Администратор может выдать подписку вручную (например, пока платёжная система не подключена)
  add('POST', '/api/admin/subscriptions', ({ body }) => {
    const contact = parseContact(body.contact);
    const target = contact && findByContact(contact);
    if (!target) throw new ApiError(404, 'not_found', 'Пользователь не найден');
    if (!['premium', 'plus'].includes(body.plan)) throw bad('invalid_plan', 'Неизвестный тариф');
    const days = Number(body.days);
    if (!Number.isInteger(days) || days < -3650 || days > 3650 || days === 0) throw bad('invalid', 'Неверный срок');
    db.prepare(`INSERT INTO subscriptions (user_id, plan, canceled, started_at, expires_at) VALUES (?,?,0,?,?)
      ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, canceled = 0, started_at = excluded.started_at, expires_at = excluded.expires_at`)
      .run(target.id, body.plan, nowIso(), addDays(days));
    return { subscription: subscriptionOf(target.id) };
  }, 'admin');

  add('GET', '/api/admin/:resource', ({ params }) => {
    const r = resourceOf(params.resource);
    return { items: db.prepare(`SELECT * FROM ${r.table} ORDER BY ${r.order}`).all().map(camel) };
  }, 'admin');

  add('POST', '/api/admin/:resource', ({ params, body }) => {
    const r = resourceOf(params.resource);
    const fields = readAdminFields(r, body, false);
    if (r.pk === 'id') fields.id = newId();
    const columns = Object.keys(fields);
    try {
      db.prepare(`INSERT INTO ${r.table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...columns.map((c) => fields[c]));
    } catch (error) {
      throw bad('invalid', `Не удалось сохранить: ${error.message}`);
    }
    return { status: 201, data: { item: camel(db.prepare(`SELECT * FROM ${r.table} WHERE ${r.pk} = ?`).get(fields[r.pk])) } };
  }, 'admin');

  add('PUT', '/api/admin/:resource/:id', ({ params, body }) => {
    const r = resourceOf(params.resource);
    const fields = readAdminFields(r, body, true);
    delete fields[r.pk];
    const columns = Object.keys(fields);
    if (columns.length === 0) throw bad('invalid', 'Нет данных для сохранения');
    let result;
    try {
      result = db.prepare(`UPDATE ${r.table} SET ${columns.map((c) => `${c} = ?`).join(',')} WHERE ${r.pk} = ?`).run(...columns.map((c) => fields[c]), params.id);
    } catch (error) {
      throw bad('invalid', `Не удалось сохранить: ${error.message}`);
    }
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Запись не найдена');
    return { item: camel(db.prepare(`SELECT * FROM ${r.table} WHERE ${r.pk} = ?`).get(params.id)) };
  }, 'admin');

  add('DELETE', '/api/admin/:resource/:id', ({ params }) => {
    const r = resourceOf(params.resource);
    const result = db.prepare(`DELETE FROM ${r.table} WHERE ${r.pk} = ?`).run(params.id);
    if (result.changes === 0) throw new ApiError(404, 'not_found', 'Запись не найдена');
    return { ok: true };
  }, 'admin');

  /**
   * Выполняет запрос. Возвращает { status, data } и никогда не бросает исключение.
   * request: { method, path, query (URLSearchParams), token, body, ip }
   */
  return async function dispatch({ method, path, query = new URLSearchParams(), token = null, body = {}, ip = '' }) {
    try {
      for (const route of routes) {
        if (route.method !== method) continue;
        const match = path.match(route.regex);
        if (!match) continue;
        const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
        const user = currentUser(token);
        if (route.access !== 'public' && !user) throw new ApiError(401, 'unauthorized', 'Войдите в аккаунт');
        if (route.access === 'admin' && user.role !== 'admin') throw new ApiError(403, 'forbidden', 'Нужны права администратора');
        const result = await route.handler({ user, params, body: body ?? {}, query, token, ip });
        if (result && result.status) return { status: result.status, data: result.data };
        return { status: 200, data: result };
      }
      throw new ApiError(404, 'not_found', 'Не найдено');
    } catch (error) {
      if (error instanceof ApiError) return { status: error.status, data: { error: { code: error.code, message: error.message } } };
      console.error(error);
      return { status: 500, data: { error: { code: 'server_error', message: 'Ошибка сервера. Попробуйте позже.' } } };
    }
  };
}
