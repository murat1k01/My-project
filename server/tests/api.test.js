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
