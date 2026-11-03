// Демо-версия для артефакта: на странице нет сервера, поэтому запросы к /api/ обрабатываются прямо в браузере.
// Логика повторяет server/api.js в сокращённом виде, данные лежат только в этом браузере.
// В приложении на телефоне этот файл не используется.
(function () {
  const DATA = window.__CAMPUS_DATA__;
  const KEY = 'campus-hub-demo-v1';
  const EMPTY = { users: [], sessions: {}, resets: {}, favorites: [], orders: [], bookings: [], requests: [], contacts: [], memberships: [] };

  let memory = null;
  function load() {
    if (memory) return memory;
    try {
      memory = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    } catch {
      memory = structuredClone(EMPTY);
    }
    return memory;
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(memory));
    } catch {
      // Без хранилища данные живут до закрытия страницы
    }
  }

  // ---------- Сообщения поверх приложения: диалоги alert и confirm в артефакте не показываются ----------
  function toast(text, ms) {
    const box = document.createElement('div');
    box.className = 'demo-toast';
    box.setAttribute('role', 'status');
    box.textContent = text;
    box.addEventListener('click', () => box.remove());
    document.body.appendChild(box);
    setTimeout(() => box.remove(), ms || 6000);
  }
  window.alert = (text) => toast(String(text));
  window.confirm = () => true;

  class HttpError extends Error {
    constructor(status, code, message) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  const bad = (code, message) => new HttpError(400, code, message);
  const clean = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
  const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const nowIso = () => new Date().toISOString();
  const pad = (n) => String(n).padStart(2, '0');
  const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function parseContact(value) {
    const text = clean(value).toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) return text;
    let digits = text.replace(/[\s()+-]/g, '');
    if (/^\d{10,11}$/.test(digits)) {
      if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
      if (digits.length === 10) digits = `7${digits}`;
      if (/^7\d{10}$/.test(digits)) return digits;
    }
    return null;
  }
  const findUser = (contact) => load().users.find((u) => u.email === contact || u.phone === contact);

  /** Пароль и в демо-версии хранится только как хеш PBKDF2 */
  async function hashPassword(password, salt) {
    const useSalt = salt || Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(useSalt), iterations: 150000 }, key, 256);
    return `${useSalt}:${Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }

  function checkPassword(password) {
    if (typeof password !== 'string' || password.length < 8) throw bad('weak_password', 'Пароль должен содержать не менее 8 символов');
    if (!/[A-Za-zА-Яа-яЁё]/.test(password) || !/\d/.test(password)) throw bad('weak_password', 'Пароль должен содержать буквы и цифры');
  }

  function profileFields(body) {
    const fields = { firstName: clean(body.firstName), lastName: clean(body.lastName), university: clean(body.university), faculty: clean(body.faculty), program: clean(body.program), group: clean(body.group).toUpperCase() };
    const labels = { firstName: 'имя', lastName: 'фамилию', university: 'университет', faculty: 'факультет', program: 'специальность', group: 'учебную группу' };
    for (const [key, value] of Object.entries(fields)) if (!value) throw bad('required', `Укажите ${labels[key]}`);
    const course = Number(body.course);
    if (!Number.isInteger(course) || course < 1 || course > 8) throw bad('required', 'Укажите курс от 1 до 8');
    return { ...fields, course };
  }

  const publicUser = ({ passwordHash, ...user }) => user;
  const directoryUser = ({ passwordHash, email, showInDirectory, showPhone, role, createdAt, ...user }) => ({ ...user, phone: showPhone ? user.phone : null });
  const startSession = (id) => {
    const token = crypto.randomUUID();
    load().sessions[token] = id;
    return token;
  };
  const FREE = { plan: 'free', status: 'none', expiresAt: null, previousPlan: null };
  const LIMITS = { book: 5, route: 1, stop: 1, dish: null, bookings: 1 };

  const routes = [];
  const add = (method, path, handler, needsUser) => {
    const keys = [];
    const regex = new RegExp(`^${path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
    routes.push({ method, regex, keys, handler, needsUser });
  };

  add('POST', '/api/auth/register', async ({ body }) => {
    const contact = parseContact(body.contact);
    if (!contact) throw bad('invalid_contact', 'Укажите корректный email или номер телефона');
    checkPassword(body.password);
    if (body.password !== body.passwordConfirm) throw bad('password_mismatch', 'Пароли не совпадают');
    const fields = profileFields(body);
    if (findUser(contact)) throw new HttpError(409, 'contact_taken', 'Аккаунт с такими данными уже существует');
    const isEmail = contact.includes('@');
    const user = { id: newId(), email: isEmail ? contact : null, phone: isEmail ? null : contact, ...fields, photo: null, showInDirectory: true, showPhone: false, role: 'student', createdAt: nowIso(), passwordHash: await hashPassword(body.password) };
    load().users.push(user);
    return { status: 201, data: { token: startSession(user.id), user: publicUser(user) } };
  });

  add('POST', '/api/auth/login', async ({ body }) => {
    const contact = parseContact(body.contact);
    const user = contact && findUser(contact);
    const fail = new HttpError(401, 'invalid_credentials', 'Неверный логин или пароль');
    if (!user || typeof body.password !== 'string') throw fail;
    if ((await hashPassword(body.password, user.passwordHash.split(':')[0])) !== user.passwordHash) throw fail;
    return { token: startSession(user.id), user: publicUser(user) };
  });

  add('POST', '/api/auth/logout', ({ token }) => {
    delete load().sessions[token];
    return { ok: true };
  }, true);

  add('POST', '/api/auth/forgot', ({ body }) => {
    const contact = parseContact(body.contact);
    if (!contact) throw bad('invalid_contact', 'Укажите корректный email или номер телефона');
    if (findUser(contact)) {
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
      load().resets[contact] = { code, until: Date.now() + 15 * 60000 };
      toast(`Демо-версия: письма и SMS не отправляются. Ваш код: ${code}`, 30000);
    }
    return { ok: true };
  });

  add('POST', '/api/auth/reset', async ({ body }) => {
    const contact = parseContact(body.contact);
    const reset = contact && load().resets[contact];
    checkPassword(body.password);
    if (!reset || reset.until < Date.now() || reset.code !== clean(body.code)) throw bad('invalid_code', 'Неверный или просроченный код');
    findUser(contact).passwordHash = await hashPassword(body.password);
    delete load().resets[contact];
    return { ok: true };
  });

  add('GET', '/api/me', ({ user }) => ({ user: publicUser(user), subscription: FREE }), true);
  add('PUT', '/api/me', ({ user, body }) => {
    Object.assign(user, profileFields(body));
    if (body.photo !== undefined) user.photo = body.photo;
    user.showInDirectory = body.showInDirectory !== false;
    user.showPhone = body.showPhone === true;
    return { user: publicUser(user) };
  }, true);

  add('GET', '/api/students', ({ user, query }) => {
    const contacts = load().contacts.filter((c) => c.ownerId === user.id);
    const all = [...load().users.filter((u) => u.showInDirectory && u.id !== user.id).map(directoryUser), ...contacts.map(({ ownerId, ...c }) => c)];
    const search = clean(query.get('q') || '').toLowerCase();
    const students = all.filter((u) => true
      && (!query.get('faculty') || u.faculty === query.get('faculty'))
      && (!query.get('program') || u.program === query.get('program'))
      && (!query.get('group') || u.group === query.get('group'))
      && (!query.get('course') || u.course === Number(query.get('course')))
      && (!search || `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) || `${u.lastName} ${u.firstName}`.toLowerCase().includes(search)));
    const values = (key) => [...new Set(all.map((u) => u[key]))].filter((v) => v !== null && v !== '').sort();
    return { students, filters: { faculty: values('faculty'), program: values('program'), group: values('group'), course: values('course') } };
  }, true);
  add('POST', '/api/students', ({ user, body }) => {
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    if (!firstName) throw bad('required', 'Укажите имя');
    if (!lastName) throw bad('required', 'Укажите фамилию');
    let phone = null;
    if (clean(body.phone)) {
      phone = parseContact(body.phone);
      if (!phone || phone.includes('@')) throw bad('invalid_contact', 'Укажите корректный номер телефона');
    }
    const student = { id: newId(), ownerId: user.id, firstName, lastName, university: null, faculty: clean(body.faculty) || null, program: clean(body.program) || null, group: clean(body.group).toUpperCase() || null, course: Number(body.course) || null, photo: null, phone, addedByMe: true };
    load().contacts.push(student);
    return { status: 201, data: { student } };
  }, true);
  add('DELETE', '/api/students/:id', ({ user, params }) => {
    const store = load();
    store.contacts = store.contacts.filter((c) => !(c.id === params.id && c.ownerId === user.id));
    return { ok: true };
  }, true);
  add('GET', '/api/students/:id', ({ user, params }) => {
    const contact = load().contacts.find((c) => c.id === params.id && c.ownerId === user.id);
    if (contact) return { student: contact };
    const student = load().users.find((u) => u.id === params.id && u.showInDirectory);
    if (!student) throw new HttpError(404, 'not_found', 'Студент не найден или скрыл свой профиль');
    return { student: directoryUser(student) };
  }, true);

  add('GET', '/api/catalog', () => ({ university: [], faculty: [], program: [], group: [] }));

  add('GET', '/api/books', ({ query }) => {
    const search = clean(query.get('q') || '').toLowerCase();
    let books = DATA.books.filter((b) => (!query.get('category') || b.category === query.get('category')) && (!search || b.title.toLowerCase().includes(search) || (b.author || '').toLowerCase().includes(search)));
    books = query.get('sort') === 'year' ? books.sort((a, b) => (b.year || 0) - (a.year || 0)) : books.sort((a, b) => a.title.localeCompare(b.title));
    return { books, categories: [...new Set(DATA.books.map((b) => b.category))].sort() };
  });
  add('GET', '/api/books/:id', ({ params }) => {
    const book = DATA.books.find((b) => b.id === params.id);
    if (!book) throw new HttpError(404, 'not_found', 'Книга не найдена');
    return { book };
  });

  add('GET', '/api/favorites/:kind', ({ user, params }) => ({ items: load().favorites.filter((f) => f.userId === user.id && f.kind === params.kind).map((f) => f.id), limit: LIMITS[params.kind] }), true);
  add('PUT', '/api/favorites/:kind/:id', ({ user, params }) => {
    const mine = load().favorites.filter((f) => f.userId === user.id && f.kind === params.kind);
    const limit = LIMITS[params.kind];
    if (!mine.some((f) => f.id === params.id)) {
      if (limit !== null && mine.length >= limit) throw new HttpError(403, 'plan_limit', `На вашем тарифе можно сохранить не больше: ${limit}. Больше — с подпиской Premium.`);
      load().favorites.unshift({ userId: user.id, kind: params.kind, id: params.id });
    }
    return { ok: true };
  }, true);
  add('DELETE', '/api/favorites/:kind/:id', ({ user, params }) => {
    const store = load();
    store.favorites = store.favorites.filter((f) => !(f.userId === user.id && f.kind === params.kind && f.id === params.id));
    return { ok: true };
  }, true);

  add('GET', '/api/menu', () => ({ items: DATA.menu, categories: [...new Set(DATA.menu.map((i) => i.category))] }));
  add('POST', '/api/orders', ({ user, body }) => {
    if (!Array.isArray(body.lines) || body.lines.length === 0) throw bad('empty_order', 'Корзина пуста');
    const delivery = body.delivery === 'delivery' ? 'delivery' : 'pickup';
    const address = clean(body.address);
    if (delivery === 'delivery' && address.length < 3) throw bad('address_required', 'Укажите адрес доставки');
    const lines = body.lines.map((line) => {
      const item = DATA.menu.find((i) => i.id === String(line.id));
      if (!item) throw bad('invalid_item', 'Одного из блюд больше нет в меню');
      return { id: item.id, name: item.name, price: item.price, qty: Number(line.qty) };
    });
    const store = load();
    const order = { id: newId(), userId: user.id, number: 101 + store.orders.length, lines, total: lines.reduce((s, l) => s + l.price * l.qty, 0), delivery, address: delivery === 'delivery' ? address : null, status: 'new', etaAt: new Date(Date.now() + (delivery === 'delivery' ? 30 : 15) * 60000).toISOString(), createdAt: nowIso(), updatedAt: nowIso() };
    store.orders.unshift(order);
    return { status: 201, data: { order } };
  }, true);
  add('GET', '/api/orders', ({ user }) => ({ orders: load().orders.filter((o) => o.userId === user.id) }), true);

  add('GET', '/api/dorms', () => ({ dorms: DATA.dorms, slots: DATA.slots }));
  add('GET', '/api/dorms/:id/machines', ({ params }) => ({ machines: DATA.machines.filter((m) => m.dormId === params.id) }));
  const active = () => load().bookings.filter((b) => b.date >= localDate());
  add('GET', '/api/laundry/slots', ({ user, query }) => {
    const date = query.get('date');
    const taken = active().filter((b) => b.machineId === query.get('machine') && b.date === date);
    return { slots: DATA.slots.map((slot) => {
      const booking = taken.find((b) => b.slot === slot);
      return { slot, state: booking ? (booking.userId === user.id ? 'mine' : 'busy') : new Date(`${date}T${slot}:00`) < new Date() ? 'past' : 'free' };
    }) };
  }, true);
  add('POST', '/api/laundry/bookings', ({ user, body }) => {
    const { machineId, date, slot } = body;
    if (new Date(`${date}T${slot}:00`) < new Date()) throw bad('slot_past', 'Это время уже прошло');
    const mine = active().filter((b) => b.userId === user.id);
    if (mine.length >= LIMITS.bookings) throw new HttpError(403, 'plan_limit', `Можно иметь не больше активных броней: ${LIMITS.bookings}. Отмените одну из них или оформите Premium.`);
    if (active().some((b) => b.machineId === machineId && b.date === date && b.slot === slot)) throw new HttpError(409, 'slot_taken', 'Это время только что заняли. Выберите другое.');
    const booking = { id: newId(), userId: user.id, machineId, date, slot };
    load().bookings.push(booking);
    return { status: 201, data: { booking } };
  }, true);
  add('GET', '/api/laundry/bookings', ({ user }) => ({
    bookings: active().filter((b) => b.userId === user.id).sort((a, b) => `${a.date}${a.slot}`.localeCompare(`${b.date}${b.slot}`)).map((b) => {
      const machine = DATA.machines.find((m) => m.id === b.machineId);
      return { id: b.id, date: b.date, slot: b.slot, machine: machine.name, floor: machine.floor, dorm: DATA.dorms.find((d) => d.id === machine.dormId).name };
    }),
  }), true);
  add('DELETE', '/api/laundry/bookings/:id', ({ user, params }) => {
    const store = load();
    store.bookings = store.bookings.filter((b) => !(b.id === params.id && b.userId === user.id));
    return { ok: true };
  }, true);

  add('POST', '/api/requests', ({ user, body }) => {
    const text = clean(body.text);
    if (text.length < 5) throw bad('required', 'Напишите сообщение (не менее 5 символов)');
    const now = nowIso();
    const request = { id: newId(), userId: user.id, kind: body.kind, category: clean(body.category) || null, targetUserId: body.targetUserId || null, text, status: 'pending', history: [{ status: 'pending', at: now }], createdAt: now };
    load().requests.unshift(request);
    return { status: 201, data: { request } };
  }, true);
  add('GET', '/api/requests', ({ user }) => {
    const all = load().requests;
    const named = (r) => {
      const from = load().users.find((u) => u.id === r.userId);
      return { ...r, fromFirstName: from?.firstName, fromLastName: from?.lastName };
    };
    return { mine: all.filter((r) => r.userId === user.id), incoming: all.filter((r) => r.targetUserId === user.id).map(named) };
  }, true);

  const summary = ({ line, stops, ...rest }) => ({ ...rest, stopCount: stops.length, hasLine: line.length > 1 });
  const transportInfo = { source: DATA.transport.source, updatedAt: DATA.transport.osmTimestamp || DATA.transport.fetchedAt };
  add('GET', '/api/transport/routes', ({ query }) => {
    const search = clean(query.get('q') || '').toLowerCase();
    const list = DATA.transport.routes.filter((r) => !search || r.number.toLowerCase().startsWith(search) || r.name.toLowerCase().includes(search) || (r.from || '').toLowerCase().includes(search) || (r.to || '').toLowerCase().includes(search));
    return { routes: list.map(summary), ...transportInfo };
  });
  add('GET', '/api/transport/routes/:id', ({ params }) => {
    const route = DATA.transport.routes.find((r) => r.id === params.id);
    if (!route) throw new HttpError(404, 'not_found', 'Маршрут не найден');
    return { route, ...transportInfo };
  });
  add('GET', '/api/transport/stops', ({ query }) => {
    const search = clean(query.get('q') || '').toLowerCase();
    if (search.length < 2) return { stops: [] };
    const found = new Map();
    for (const route of DATA.transport.routes) {
      for (const stop of route.stops) {
        if (!stop.name.toLowerCase().includes(search)) continue;
        const entry = found.get(stop.name) || { ...stop, routes: [] };
        if (!entry.routes.some((r) => r.number === route.number)) entry.routes.push({ id: route.id, number: route.number });
        found.set(stop.name, entry);
      }
    }
    return { stops: [...found.values()].slice(0, 30) };
  });
  add('GET', '/api/transport/vehicles', () => ({ available: false, vehicles: [], reason: 'not_configured' }));

  add('GET', '/api/info', ({ query }) => {
    const search = clean(query.get('q') || '').toLowerCase();
    return { pages: DATA.pages.filter((p) => !search || p.title.toLowerCase().includes(search) || p.body.toLowerCase().includes(search)) };
  });

  add('GET', '/api/plans', () => ({ plans: DATA.plans, paymentsEnabled: false }));
  add('POST', '/api/subscription/checkout', () => {
    throw new HttpError(501, 'payments_not_configured', 'Оплата пока не подключена. Деньги не списаны, подписка не оформлена.');
  }, true);
  add('POST', '/api/subscription/cancel', () => {
    throw new HttpError(404, 'not_found', 'Активной подписки нет');
  }, true);
  add('GET', '/api/membership', ({ user }) => ({ membership: load().memberships.find((m) => m.userId === user.id) || null }), true);
  add('POST', '/api/membership', ({ user, body }) => {
    if (load().memberships.some((m) => m.userId === user.id)) throw new HttpError(409, 'membership_exists', 'У вас уже есть абонемент или заявка на него');
    const membership = { id: newId(), userId: user.id, planId: body.planId, status: 'pending', expiresAt: null, createdAt: nowIso() };
    load().memberships.push(membership);
    return { status: 201, data: { membership } };
  }, true);
  add('DELETE', '/api/membership', ({ user }) => {
    const store = load();
    store.memberships = store.memberships.filter((m) => m.userId !== user.id);
    return { ok: true };
  }, true);

  const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  const realFetch = window.fetch.bind(window);

  window.fetch = async function (input, init) {
    const href = typeof input === 'string' ? input : input.url;
    const url = new URL(href, location.href);
    if (!url.pathname.startsWith('/api/')) return realFetch(input, init);
    const method = (init && init.method) || 'GET';
    try {
      for (const route of routes) {
        if (route.method !== method) continue;
        const match = url.pathname.match(route.regex);
        if (!match) continue;
        const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
        const auth = (init && init.headers && init.headers.Authorization) || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
        const user = token ? load().users.find((u) => u.id === load().sessions[token]) : null;
        if (route.needsUser && !user) throw new HttpError(401, 'unauthorized', 'Войдите в аккаунт');
        const body = init && init.body ? JSON.parse(init.body) : {};
        const result = await route.handler({ user, token, params, body, query: url.searchParams });
        save();
        if (result.status) return json(result.status, result.data);
        return json(200, result);
      }
      throw new HttpError(404, 'not_found', 'В демо-версии этот раздел недоступен');
    } catch (error) {
      if (error instanceof HttpError) return json(error.status, { error: { code: error.code, message: error.message } });
      console.error(error);
      return json(500, { error: { code: 'server_error', message: 'Ошибка. Попробуйте ещё раз.' } });
    }
  };

  window.addEventListener('DOMContentLoaded', () => toast('Демо-версия без сервера: аккаунт и данные хранятся только в этом браузере.', 7000));
})();
