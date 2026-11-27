// Тесты сервера на настоящем HTTP и настоящей базе в памяти. Запуск: npm run test:server
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { createApi } from '../api.js';
import { openDatabase } from '../db.js';

let server;
let base;
let db;
const resetCodes = new Map();

const student = (over = {}) => ({
  contact: 'test.user@example.com',
  password: 'Passw0rd123',
  passwordConfirm: 'Passw0rd123',
  firstName: 'Тест',
  lastName: 'Пользователь',
  university: 'Тестовый университет',
  faculty: 'ИТ',
  program: 'Информационные системы',
  group: 'it-1',
  course: 2,
  ...over,
});

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

const register = async (over) => (await call('POST', '/api/auth/register', { body: student(over) })).data;
const tomorrow = () => {
  const d = new Date(Date.now() + 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

before(async () => {
  db = openDatabase(':memory:');
  const handler = createApi(db, { adminEmail: 'admin@example.com', onResetCode: (contact, code) => resetCodes.set(contact, code) });
  server = createServer(handler);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('регистрация: проверка полей', async () => {
  assert.equal((await call('POST', '/api/auth/register', { body: student({ contact: 'неправильно' }) })).data.error.code, 'invalid_contact');
  assert.equal((await call('POST', '/api/auth/register', { body: student({ contact: 'a@b.kz', passwordConfirm: 'other12345' }) })).data.error.code, 'password_mismatch');
  assert.equal((await call('POST', '/api/auth/register', { body: student({ contact: 'a@b.kz', password: 'short1', passwordConfirm: 'short1' }) })).data.error.code, 'weak_password');
  assert.equal((await call('POST', '/api/auth/register', { body: student({ contact: 'a@b.kz', faculty: ' ' }) })).data.error.code, 'required');
});

test('регистрация и запрет повторной регистрации', async () => {
  const first = await call('POST', '/api/auth/register', { body: student() });
  assert.equal(first.status, 201);
  assert.equal(first.data.user.firstName, 'Тест');
  assert.equal(first.data.user.group, 'IT-1');
  assert.ok(!JSON.stringify(first.data).includes('Passw0rd123'));
  const stored = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('test.user@example.com');
  assert.ok(stored.password_hash.startsWith('scrypt$'));
  const again = await call('POST', '/api/auth/register', { body: student({ contact: 'TEST.user@example.com' }) });
  assert.equal(again.status, 409);
});

test('вход, неверный пароль, профиль и выход', async () => {
  const wrong = await call('POST', '/api/auth/login', { body: { contact: 'test.user@example.com', password: 'wrongpass1' } });
  assert.equal(wrong.status, 401);
  const ok = await call('POST', '/api/auth/login', { body: { contact: 'test.user@example.com', password: 'Passw0rd123' } });
  assert.equal(ok.status, 200);
  const { token } = ok.data;
  assert.equal((await call('GET', '/api/me')).status, 401);
  assert.equal((await call('GET', '/api/me', { token })).data.user.email, 'test.user@example.com');
  const edited = await call('PUT', '/api/me', { token, body: { ...student(), firstName: 'Новое', showInDirectory: true } });
  assert.equal(edited.data.user.firstName, 'Новое');
  await call('POST', '/api/auth/logout', { token });
  assert.equal((await call('GET', '/api/me', { token })).status, 401);
});

test('восстановление пароля', async () => {
  const contact = 'reset@example.com';
  await register({ contact });
  await call('POST', '/api/auth/forgot', { body: { contact } });
  const code = resetCodes.get(contact);
  assert.ok(code);
  assert.equal((await call('POST', '/api/auth/reset', { body: { contact, code: '000000', password: 'NewPass1234' } })).status, 400);
  assert.equal((await call('POST', '/api/auth/reset', { body: { contact, code, password: 'NewPass1234' } })).status, 200);
  assert.equal((await call('POST', '/api/auth/login', { body: { contact, password: 'NewPass1234' } })).status, 200);
  assert.equal((await call('POST', '/api/auth/reset', { body: { contact, code, password: 'Again12345' } })).status, 400);
});

test('студенты: база без вымышленных людей, приватность, фильтры', async () => {
  const fresh = openDatabase(':memory:');
  assert.equal(fresh.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);

  const a = await register({ contact: 'a1@example.com', firstName: 'Айдана', lastName: 'Первая', group: 'dir-1' });
  await register({ contact: 'a2@example.com', firstName: 'Бекзат', lastName: 'Второй', group: 'dir-2', faculty: 'Экономика' });
  const hidden = await register({ contact: 'a3@example.com', firstName: 'Скрытый', lastName: 'Третий', group: 'dir-1' });
  await call('PUT', '/api/me', { token: hidden.token, body: { ...student({ firstName: 'Скрытый', lastName: 'Третий', group: 'dir-1' }), showInDirectory: false } });

  assert.equal((await call('GET', '/api/students')).status, 401);
  const all = (await call('GET', '/api/students', { token: a.token })).data.students;
  assert.ok(all.some((s) => s.firstName === 'Бекзат'));
  assert.ok(!all.some((s) => s.firstName === 'Скрытый'));
  assert.ok(!all.some((s) => s.firstName === 'Айдана'), 'себя в списке нет');
  assert.ok(all.every((s) => !('email' in s) && !('passwordHash' in s)));
  const byGroup = (await call('GET', '/api/students?group=DIR-2', { token: a.token })).data.students;
  assert.deepEqual(byGroup.map((s) => s.firstName), ['Бекзат']);
  assert.equal((await call('GET', `/api/students?q=${encodeURIComponent('бекз')}`, { token: a.token })).data.students.length, 1);
  assert.equal((await call('GET', `/api/students/${hidden.user.id}`, { token: a.token })).status, 404);
});

test('студенты: свою запись можно добавить, её видит только автор', async () => {
  const owner = await register({ contact: 'owner@example.com' });
  const other = await register({ contact: 'stranger@example.com' });
  assert.equal((await call('POST', '/api/students', { body: { firstName: 'А', lastName: 'Б' } })).status, 401);
  assert.equal((await call('POST', '/api/students', { token: owner.token, body: { firstName: ' ', lastName: 'Б' } })).status, 400);
  assert.equal((await call('POST', '/api/students', { token: owner.token, body: { firstName: 'А', lastName: 'Б', phone: '123' } })).data.error.code, 'invalid_contact');
  const created = await call('POST', '/api/students', { token: owner.token, body: { firstName: 'Новый', lastName: 'Знакомый', group: 'add-1', course: 3, phone: '8 700 000 00 00' } });
  assert.equal(created.status, 201);
  const { id } = created.data.student;
  assert.equal(created.data.student.phone, '77000000000');

  const mine = (await call('GET', '/api/students?group=ADD-1', { token: owner.token })).data;
  assert.equal(mine.students[0].addedByMe, true);
  assert.ok(mine.filters.group.includes('ADD-1'));
  assert.equal((await call('GET', `/api/students/${id}`, { token: owner.token })).data.student.firstName, 'Новый');

  const seen = (await call('GET', '/api/students', { token: other.token })).data;
  assert.ok(!seen.students.some((s) => s.id === id), 'чужая запись не видна');
  assert.ok(!seen.filters.group.includes('ADD-1'));
  assert.equal((await call('GET', `/api/students/${id}`, { token: other.token })).status, 404);
  assert.equal((await call('DELETE', `/api/students/${id}`, { token: other.token })).status, 404);
  assert.equal((await call('DELETE', `/api/students/${id}`, { token: owner.token })).status, 200);
});

test('студенты: один общий поиск по имени, группе и специальности', async () => {
  const me = await register({ contact: 'finder@example.com' });
  await register({ contact: 'target@example.com', firstName: 'Жансая', lastName: 'Поиск', group: 'srch-7', program: 'Цифровая логистика' });
  const find = async (q) => (await call('GET', `/api/students?q=${encodeURIComponent(q)}`, { token: me.token })).data.students.map((s) => s.firstName);
  assert.ok((await find('жансая')).includes('Жансая'));
  assert.ok((await find('SRCH-7')).includes('Жансая'));
  assert.ok((await find('цифровая лог')).includes('Жансая'));
  assert.deepEqual(await find('нет-такого'), []);
});

test('оплата: тестовая привязка хранит только последние 4 цифры', async () => {
  const { token } = await register({ contact: 'pay@example.com' });
  const other = await register({ contact: 'pay2@example.com' });
  const raw = await call('POST', '/api/payment-methods', { token, body: { cardNumber: '1234567812345678', cvv: '123' } });
  assert.equal(raw.data.error.code, 'raw_card');
  assert.equal((await call('POST', '/api/payment-methods', { token, body: { last4: '5678', expMonth: '12', expYear: '2030', holder: 'AIDANA' } })).status, 400, 'без тестового режима');
  const bound = await call('POST', '/api/payment-methods', { token, body: { mode: 'test', last4: '5678', expMonth: '12', expYear: '2030', holder: 'aidana serikova' } });
  assert.equal(bound.status, 201);
  const cards = (await call('GET', '/api/payment-methods', { token })).data.cards;
  assert.equal(cards.length, 1);
  assert.equal(cards[0].last4, '5678');
  assert.equal(cards[0].holder, 'AIDANA SERIKOVA');
  const stored = JSON.stringify(db.prepare('SELECT * FROM payment_methods').all());
  assert.ok(!stored.includes('1234567812345678') && !stored.includes('"123"'));
  assert.equal((await call('DELETE', `/api/payment-methods/${cards[0].id}`, { token: other.token })).status, 404, 'чужую карту отвязать нельзя');
  assert.equal((await call('DELETE', `/api/payment-methods/${cards[0].id}`, { token })).status, 200);
  assert.equal((await call('GET', '/api/payment-methods')).status, 401);
});

test('информация: страницы ALT есть, дубли главной убраны, общежитие заполнено', async () => {
  const pages = (await call('GET', '/api/info')).data.pages.map((p) => p.slug);
  for (const slug of ['university', 'opportunities', 'student-life']) assert.ok(pages.includes(slug), slug);
  for (const slug of ['library', 'food', 'transport', 'sport', 'dormitory', 'schedule']) assert.ok(!pages.includes(slug), slug);
  const dorm = (await call('GET', '/api/dorms')).data.dorms[0];
  assert.equal(dorm.address, 'Алматы, ул. Масанчи, 88');
  assert.equal(dorm.contacts, '6969');
  assert.equal(dorm.hours, '06:00–23:00');
});

test('библиотека: не меньше 50 книг, поиск, фильтр, сортировка', async () => {
  const all = (await call('GET', '/api/books')).data;
  assert.ok(all.books.length >= 50, `книг: ${all.books.length}`);
  assert.ok(all.books.every((b) => b.title && b.category));
  assert.ok((await call('GET', '/api/books?q=clean%20code')).data.books.length >= 1);
  assert.ok((await call('GET', '/api/books?q=martin')).data.books.length >= 1);
  const python = (await call('GET', '/api/books?category=Python')).data.books;
  assert.ok(python.length > 0 && python.every((b) => b.category === 'Python'));
  const byYear = (await call('GET', '/api/books?sort=year')).data.books.map((b) => b.year ?? 0);
  assert.deepEqual(byYear, [...byYear].sort((x, y) => y - x));
  const local = all.books.find((b) => b.coverUrl?.startsWith('/covers/'));
  assert.ok(local, 'обложки отдаёт сам сервер');
  const image = await fetch(base + local.coverUrl);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/jpeg');
  assert.equal((await fetch(`${base}/covers/..%2F..%2Fapi.js`)).status, 404);
});

test('избранное: лимит бесплатного тарифа проверяется на сервере', async () => {
  const { token } = await register({ contact: 'fav@example.com' });
  const ids = (await call('GET', '/api/books')).data.books.map((b) => b.id);
  for (const id of ids.slice(0, 5)) assert.equal((await call('PUT', `/api/favorites/book/${id}`, { token })).status, 200);
  assert.equal((await call('PUT', `/api/favorites/book/${ids[5]}`, { token })).data.error.code, 'plan_limit');
  await call('DELETE', `/api/favorites/book/${ids[0]}`, { token });
  assert.equal((await call('PUT', `/api/favorites/book/${ids[5]}`, { token })).status, 200);
  assert.equal((await call('GET', '/api/favorites/book', { token })).data.items.length, 5);
});

test('стирка: один интервал нельзя занять дважды, лимит и отмена', async () => {
  const one = await register({ contact: 'wash1@example.com' });
  const two = await register({ contact: 'wash2@example.com' });
  const dorm = (await call('GET', '/api/dorms')).data.dorms[0];
  const machines = (await call('GET', `/api/dorms/${dorm.id}/machines`)).data.machines;
  const date = tomorrow();
  const slotBody = { machineId: machines[0].id, date, slot: '11:00' };

  const results = await Promise.all([
    call('POST', '/api/laundry/bookings', { token: one.token, body: slotBody }),
    call('POST', '/api/laundry/bookings', { token: two.token, body: slotBody }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409], 'одновременно бронь получает только один');
  const winner = results[0].status === 201 ? one : two;
  const loser = results[0].status === 201 ? two : one;
  const bookingId = (results[0].status === 201 ? results[0] : results[1]).data.booking.id;

  const seen = (await call('GET', `/api/laundry/slots?machine=${machines[0].id}&date=${date}`, { token: loser.token })).data.slots;
  assert.equal(seen.find((s) => s.slot === '11:00').state, 'busy');
  const mine = (await call('GET', `/api/laundry/slots?machine=${machines[0].id}&date=${date}`, { token: winner.token })).data.slots;
  assert.equal(mine.find((s) => s.slot === '11:00').state, 'mine');

  const second = await call('POST', '/api/laundry/bookings', { token: winner.token, body: { ...slotBody, slot: '12:30' } });
  assert.equal(second.data.error.code, 'plan_limit');
  assert.equal((await call('DELETE', `/api/laundry/bookings/${bookingId}`, { token: loser.token })).status, 404, 'чужую бронь отменить нельзя');
  assert.equal((await call('DELETE', `/api/laundry/bookings/${bookingId}`, { token: winner.token })).status, 200);
  assert.equal((await call('POST', '/api/laundry/bookings', { token: loser.token, body: slotBody })).status, 201);
});

test('столовая: цену считает сервер, статус меняет только администратор', async () => {
  const { token } = await register({ contact: 'food@example.com' });
  const admin = await register({ contact: 'admin@example.com' });
  const items = (await call('GET', '/api/menu')).data.items;
  const item = items[0];
  const order = await call('POST', '/api/orders', { token, body: { delivery: 'pickup', lines: [{ id: item.id, qty: 2, price: 1 }] } });
  assert.equal(order.status, 201);
  assert.equal(order.data.order.total, item.price * 2);
  assert.equal(order.data.order.status, 'new');
  assert.equal((await call('POST', '/api/orders', { token, body: { delivery: 'delivery', address: '', lines: [{ id: item.id, qty: 1 }] } })).data.error.code, 'address_required');
  assert.equal((await call('PATCH', `/api/admin/orders/${order.data.order.id}`, { token, body: { status: 'done' } })).status, 403);
  assert.equal((await call('PATCH', `/api/admin/orders/${order.data.order.id}`, { token: admin.token, body: { status: 'cooking' } })).status, 200);
  assert.equal((await call('GET', '/api/orders', { token })).data.orders[0].status, 'cooking');
});

test('подписка: оплата не имитируется, истечение учитывается', async () => {
  const { token } = await register({ contact: 'sub@example.com' });
  const admin = (await call('POST', '/api/auth/login', { body: { contact: 'admin@example.com', password: 'Passw0rd123' } })).data;
  assert.equal((await call('GET', '/api/subscription', { token })).data.subscription.plan, 'free');
  const pay = await call('POST', '/api/subscription/checkout', { token, body: { plan: 'premium' } });
  assert.equal(pay.status, 501);
  assert.equal((await call('GET', '/api/subscription', { token })).data.subscription.plan, 'free');

  const grant = (body) => call('POST', '/api/admin/subscriptions', { token: admin.token, body: { contact: 'sub@example.com', ...body } });
  assert.equal((await call('POST', '/api/admin/subscriptions', { token, body: { contact: 'sub@example.com', plan: 'plus', days: 30 } })).status, 403, 'выдать себе подписку нельзя');
  await grant({ plan: 'premium', days: 30 });
  assert.equal((await call('POST', '/api/subscription/cancel', { token })).data.subscription.status, 'canceled');
  await grant({ plan: 'plus', days: -1 });
  const expired = (await call('GET', '/api/subscription', { token })).data.subscription;
  assert.equal(expired.status, 'expired');
  assert.equal(expired.plan, 'free');
});

test('абонемент: заявка, подтверждение администратором и отмена', async () => {
  const { token } = await register({ contact: 'gym@example.com' });
  const admin = await call('POST', '/api/auth/login', { body: { contact: 'admin@example.com', password: 'Passw0rd123' } });
  assert.equal((await call('GET', '/api/membership', { token })).data.membership, null);
  assert.equal((await call('POST', '/api/membership', { token, body: { planId: 'nope' } })).status, 400);
  const created = await call('POST', '/api/membership', { token, body: { planId: 'month' } });
  assert.equal(created.data.membership.status, 'pending');
  assert.equal((await call('POST', '/api/membership', { token, body: { planId: 'single' } })).status, 409);
  const { id } = created.data.membership;
  assert.equal((await call('PATCH', `/api/admin/memberships/${id}`, { token, body: { status: 'active' } })).status, 403, 'подтвердить себе нельзя');
  await call('PATCH', `/api/admin/memberships/${id}`, { token: admin.data.token, body: { status: 'active' } });
  const active = (await call('GET', '/api/membership', { token })).data.membership;
  assert.equal(active.status, 'active');
  assert.ok(active.expiresAt > new Date().toISOString());
  assert.equal((await call('DELETE', '/api/membership', { token })).status, 200);
  assert.equal((await call('GET', '/api/membership', { token })).data.membership, null);
  // История хранит и отменённую заявку
  const history = (await call('GET', '/api/membership/history', { token })).data.items;
  assert.equal(history.length, 1);
  assert.equal(history[0].status, 'canceled');
});

test('администрирование: права проверяет сервер, контент редактируется', async () => {
  const user = await register({ contact: 'plain@example.com' });
  const admin = (await call('POST', '/api/auth/login', { body: { contact: 'admin@example.com', password: 'Passw0rd123' } })).data;
  assert.equal(admin.user.role, 'admin');
  assert.equal((await call('GET', '/api/admin/books')).status, 401);
  assert.equal((await call('GET', '/api/admin/books', { token: user.token })).status, 403);
  // Попытка стать администратором через профиль игнорируется
  const me = await call('PUT', '/api/me', { token: user.token, body: { ...student(), role: 'admin' } });
  assert.equal(me.data.user.role, 'student');

  const created = await call('POST', '/api/admin/menu', { token: admin.token, body: { name: 'Новое блюдо', price: 999, category: 'Супы' } });
  assert.equal(created.status, 201);
  const updated = await call('PUT', `/api/admin/menu/${created.data.item.id}`, { token: admin.token, body: { price: 1200, available: false } });
  assert.equal(updated.data.item.price, 1200);
  assert.equal(updated.data.item.available, 0);
  assert.equal((await call('POST', '/api/admin/menu', { token: admin.token, body: { name: 'Без цены', category: 'Супы' } })).status, 400);
  assert.equal((await call('POST', '/api/orders', { token: user.token, body: { delivery: 'pickup', lines: [{ id: created.data.item.id, qty: 1 }] } })).data.error.code, 'unavailable');
  assert.equal((await call('DELETE', `/api/admin/menu/${created.data.item.id}`, { token: admin.token })).status, 200);
  assert.equal((await call('GET', '/api/admin/неизвестно', { token: admin.token })).status, 404);
  const page = await call('PUT', '/api/admin/pages/contacts', { token: admin.token, body: { body: 'Деканат: кабинет 101' } });
  assert.equal(page.status, 200);
  assert.equal((await call('GET', `/api/info?q=${encodeURIComponent('кабинет 101')}`)).data.pages[0].slug, 'contacts');
});

test('заявки: статус и дату меняет только администратор', async () => {
  const { token } = await register({ contact: 'req@example.com' });
  const other = await register({ contact: 'req2@example.com' });
  const admin = (await call('POST', '/api/auth/login', { body: { contact: 'admin@example.com', password: 'Passw0rd123' } })).data;
  const created = await call('POST', '/api/requests', { token, body: { kind: 'repair', category: 'Сантехника', text: 'Течёт кран в комнате' } });
  assert.equal(created.status, 201);
  assert.equal(created.data.request.status, 'pending');
  assert.equal((await call('POST', '/api/requests', { token, body: { kind: 'repair', text: 'a' } })).status, 400);
  const id = created.data.request.id;
  assert.equal((await call('PATCH', `/api/admin/requests/${id}`, { token, body: { status: 'resolved' } })).status, 403);
  await call('PATCH', `/api/admin/requests/${id}`, { token: admin.token, body: { status: 'decision' } });
  const mine = (await call('GET', '/api/requests', { token })).data.mine[0];
  assert.equal(mine.status, 'decision');
  assert.deepEqual(mine.history.map((h) => h.status), ['pending', 'decision']);
  const response = await call('POST', '/api/requests', { token, body: { kind: 'response', targetUserId: other.user.id, text: 'Хочу в команду проекта' } });
  assert.equal(response.status, 201);
  assert.equal((await call('GET', '/api/requests', { token: other.token })).data.incoming[0].text, 'Хочу в команду проекта');
});

test('транспорт: реальные маршруты и честный ответ об отсутствии координат', async () => {
  const list = (await call('GET', '/api/transport/routes')).data;
  assert.ok(list.routes.length > 50);
  assert.match(list.source, /OpenStreetMap/);
  const found = (await call('GET', '/api/transport/routes?q=12')).data.routes.find((r) => r.number === '12');
  assert.ok(found);
  const route = (await call('GET', `/api/transport/routes/${found.id}`)).data.route;
  assert.ok(route.stops.length > 1 && route.line.length > 1);
  assert.ok((await call('GET', `/api/transport/stops?q=${encodeURIComponent('медеу')}`)).data.stops.length >= 1);
  const vehicles = (await call('GET', '/api/transport/vehicles')).data;
  assert.equal(vehicles.available, false);
  assert.deepEqual(vehicles.vehicles, []);
});

test('несуществующий адрес и неверный JSON', async () => {
  assert.equal((await call('GET', '/api/nothing')).status, 404);
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', body: '{oops' });
  assert.equal(res.status, 400);
});

test('подписка в тестовом режиме: нужна своя тестовая карта, деньги не списываются', async () => {
  const { token } = await register({ contact: 'subtest@example.com' });
  const other = await register({ contact: 'subother@example.com' });
  assert.equal((await call('POST', '/api/subscription/checkout', { token, body: { plan: 'premium', mode: 'test' } })).status, 400, 'без карты нельзя');
  await call('POST', '/api/payment-methods', { token: other.token, body: { mode: 'test', holder: 'OTHER USER', last4: '1111', expMonth: '01', expYear: '2031' } });
  const otherCard = (await call('GET', '/api/payment-methods', { token: other.token })).data.cards[0];
  assert.equal((await call('POST', '/api/subscription/checkout', { token, body: { plan: 'premium', mode: 'test', paymentMethodId: otherCard.id } })).status, 400, 'чужая карта не подходит');
  await call('POST', '/api/payment-methods', { token, body: { mode: 'test', holder: 'TEST USER', last4: '4242', expMonth: '12', expYear: '2031' } });
  const card = (await call('GET', '/api/payment-methods', { token })).data.cards[0];
  const pay = await call('POST', '/api/subscription/checkout', { token, body: { plan: 'plus', mode: 'test', paymentMethodId: card.id } });
  assert.equal(pay.status, 200);
  assert.equal(pay.data.charged, 0);
  assert.equal(pay.data.subscription.plan, 'plus');
  assert.equal(pay.data.subscription.status, 'active');
});

test('сообщения студентам и задачи', async () => {
  const a = await register({ contact: 'msg-a@example.com' });
  const b = await register({ contact: 'msg-b@example.com' });
  assert.equal((await call('POST', `/api/messages/${b.user.id}`, { token: a.token, body: { text: '  ' } })).status, 400);
  assert.equal((await call('POST', `/api/messages/${a.user.id}`, { token: a.token, body: { text: 'себе' } })).status, 404);
  assert.equal((await call('POST', `/api/messages/${b.user.id}`, { token: a.token, body: { text: 'Привет! Есть конспект?' } })).status, 201);
  const inbox = (await call('GET', '/api/messages', { token: b.token })).data.chats;
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].unread, 1);
  const thread = (await call('GET', `/api/messages/${a.user.id}`, { token: b.token })).data;
  assert.equal(thread.messages[0].mine, false);
  assert.equal((await call('GET', '/api/messages', { token: b.token })).data.chats[0].unread, 0, 'прочитано');
  assert.equal((await call('GET', '/api/messages', { token: a.token })).status, 200);

  const todo = await call('POST', '/api/todos', { token: a.token, body: { title: 'Сдать лабораторную', dueDate: '2026-12-01' } });
  assert.equal(todo.status, 201);
  assert.equal((await call('POST', '/api/todos', { token: a.token, body: { title: 'x', dueDate: 'завтра' } })).status, 400);
  assert.equal((await call('PATCH', `/api/todos/${todo.data.item.id}`, { token: b.token, body: { done: true } })).status, 404, 'чужую задачу менять нельзя');
  assert.equal((await call('PATCH', `/api/todos/${todo.data.item.id}`, { token: a.token, body: { done: true } })).data.item.done, true);
  assert.equal((await call('GET', '/api/todos', { token: b.token })).data.items.length, 0);

});

test('объявления: маркетплейс и находки, права автора, модерация, сообщение автору', async () => {
  const seller = await register({ contact: 'seller@example.com' });
  const buyer = await register({ contact: 'buyer@example.com' });
  // Продавец скрыт из списка студентов, но написать автору объявления можно
  await call('PUT', '/api/me', { token: seller.token, body: { ...student(), showInDirectory: false } });
  assert.equal((await call('POST', '/api/listings', { token: seller.token, body: { kind: 'market', title: 'Учебник', price: 'дорого' } })).status, 400, 'цена числом');
  assert.equal((await call('POST', '/api/listings', { token: seller.token, body: { kind: 'other', title: 'Учебник' } })).status, 400);
  const item = await call('POST', '/api/listings', { token: seller.token, body: { kind: 'market', title: 'Учебник по Python', price: 6000, category: 'Книги' } });
  assert.equal(item.status, 201);
  const lost = await call('POST', '/api/listings', { token: buyer.token, body: { kind: 'lost', title: 'Рюкзак чёрный', place: 'А-корпус', eventDate: '2026-11-20' } });
  assert.equal(lost.status, 201);
  assert.equal(lost.data.listing.price, null);
  const market = (await call('GET', '/api/listings?kind=market&q=python', { token: buyer.token })).data.listings;
  assert.equal(market.length, 1);
  assert.equal(market[0].mine, false);
  assert.equal((await call('POST', `/api/messages/${seller.user.id}`, { token: buyer.token, body: { text: 'Учебник ещё продаётся?' } })).status, 201);
  assert.equal((await call('PATCH', `/api/listings/${item.data.listing.id}`, { token: buyer.token, body: { status: 'closed' } })).status, 404, 'чужое закрыть нельзя');
  assert.equal((await call('POST', `/api/listings/${item.data.listing.id}/report`, { token: buyer.token })).status, 200);
  const admin = (await call('POST', '/api/auth/login', { body: { contact: 'admin@example.com', password: 'Passw0rd123' } })).data;
  assert.equal((await call('GET', '/api/admin/listings', { token: buyer.token })).status, 403);
  assert.equal((await call('GET', '/api/admin/listings', { token: admin.token })).data.items[0].reports, 1);
  assert.equal((await call('PATCH', `/api/listings/${item.data.listing.id}`, { token: seller.token, body: { status: 'closed' } })).status, 200);
  assert.equal((await call('GET', '/api/listings?kind=market', { token: buyer.token })).data.listings.length, 0, 'закрытое не видно другим');
  assert.equal((await call('GET', '/api/listings?kind=market', { token: seller.token })).data.listings.length, 1, 'автор видит своё');
  assert.equal((await call('DELETE', `/api/listings/${lost.data.listing.id}`, { token: admin.token })).status, 200, 'администратор удаляет');
});

test('учебные комнаты: бронь, занятое время, лимит и отмена', async () => {
  const a = await register({ contact: 'study-a@example.com' });
  const b = await register({ contact: 'study-b@example.com' });
  const { rooms, slots } = (await call('GET', '/api/study-rooms', { token: a.token })).data;
  assert.ok(rooms.length > 0);
  const date = tomorrow();
  const first = await call('POST', '/api/study-bookings', { token: a.token, body: { roomId: rooms[0].id, date, slot: slots[0] } });
  assert.equal(first.status, 201);
  assert.equal((await call('POST', '/api/study-bookings', { token: b.token, body: { roomId: rooms[0].id, date, slot: slots[0] } })).status, 409);
  const view = (await call('GET', `/api/study-rooms/${rooms[0].id}/slots?date=${date}`, { token: b.token })).data.slots;
  assert.equal(view[0].state, 'busy');
  assert.equal((await call('POST', '/api/study-bookings', { token: a.token, body: { roomId: rooms[0].id, date, slot: slots[1] } })).status, 201);
  assert.equal((await call('POST', '/api/study-bookings', { token: a.token, body: { roomId: rooms[0].id, date, slot: slots[2] } })).status, 403, 'лимит броней');
  assert.equal((await call('DELETE', `/api/study-bookings/${first.data.booking.id}`, { token: b.token })).status, 404, 'чужую бронь не отменить');
  assert.equal((await call('DELETE', `/api/study-bookings/${first.data.booking.id}`, { token: a.token })).status, 200);
  assert.equal((await call('GET', '/api/study-bookings', { token: a.token })).data.bookings.length, 1);
});

test('кошелёк: только тестовый режим, своя карта, баланс не уходит в минус', async () => {
  const { token } = await register({ contact: 'wallet@example.com' });
  assert.equal((await call('GET', '/api/wallet', { token })).data.balance, 0);
  assert.equal((await call('POST', '/api/wallet/topup', { token, body: { amount: 5000 } })).status, 501, 'без тестового режима оплаты нет');
  assert.equal((await call('POST', '/api/wallet/topup', { token, body: { amount: 5000, mode: 'test' } })).status, 400, 'нужна карта');
  await call('POST', '/api/payment-methods', { token, body: { mode: 'test', holder: 'TEST USER', last4: '4242', expMonth: '12', expYear: '2031' } });
  const card = (await call('GET', '/api/payment-methods', { token })).data.cards[0];
  const top = await call('POST', '/api/wallet/topup', { token, body: { amount: 5000, mode: 'test', paymentMethodId: card.id } });
  assert.equal(top.data.balance, 5000);
  assert.equal((await call('POST', '/api/wallet/pay', { token, body: { amount: 9000, purpose: 'food', mode: 'test' } })).status, 409, 'недостаточно средств');
  const pay = await call('POST', '/api/wallet/pay', { token, body: { amount: 1200, purpose: 'food', mode: 'test' } });
  assert.equal(pay.data.balance, 3800);
  assert.ok(pay.data.transactions[0].title.includes('тест'));
});

test('документы: запрос справки, статус меняет только администратор', async () => {
  const { token } = await register({ contact: 'docs@example.com' });
  assert.equal((await call('POST', '/api/documents', { token, body: { docType: 'passport' } })).status, 400);
  assert.equal((await call('POST', '/api/documents', { token, body: { docType: 'statement', comment: '' } })).status, 400, 'заявлению нужен текст');
  const req = await call('POST', '/api/documents', { token, body: { docType: 'enrollment', comment: 'Для военкомата' } });
  assert.equal(req.status, 201);
  assert.equal((await call('PATCH', `/api/admin/documents/${req.data.request.id}`, { token, body: { status: 'ready' } })).status, 403);
  const admin = (await call('POST', '/api/auth/login', { body: { contact: 'admin@example.com', password: 'Passw0rd123' } })).data;
  assert.equal((await call('PATCH', `/api/admin/documents/${req.data.request.id}`, { token: admin.token, body: { status: 'ready' } })).status, 200);
  const mine = (await call('GET', '/api/documents', { token })).data.requests[0];
  assert.equal(mine.status, 'ready');
  assert.equal(mine.history.length, 2);
});
