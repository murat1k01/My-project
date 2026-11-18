// Проверка встроенной базы телефона: тот же код API, но с хешами из @noble/hashes,
// как в src/api/local. Обёртка базы повторяет поведение expo-sqlite (нет строки → null).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { createRouter } from '../core/router.js';
import { migrate } from '../core/schema.js';
import { seed } from '../core/seed.js';

const SCRYPT = { N: 16384, r: 8, p: 1, dkLen: 64 };
const security = {
  async hashPassword(password) {
    const salt = randomBytes(16);
    return `scrypt$${bytesToHex(salt)}$${bytesToHex(await scryptAsync(utf8ToBytes(password), salt, SCRYPT))}`;
  },
  async verifyPassword(password, stored) {
    const [, saltHex, hashHex] = stored.split('$');
    return bytesToHex(await scryptAsync(utf8ToBytes(password), hexToBytes(saltHex), SCRYPT)) === hashHex;
  },
  sha256: (value) => bytesToHex(sha256(utf8ToBytes(value))),
  newToken: () => bytesToHex(randomBytes(32)),
  newResetCode: () => '123456',
  newId: () => bytesToHex(randomBytes(9)),
};

function expoLikeDb() {
  const raw = new DatabaseSync(':memory:');
  return {
    exec: (sql) => raw.exec(sql),
    prepare: (sql) => {
      const statement = raw.prepare(sql);
      return {
        get: (...p) => statement.get(...p) ?? undefined,
        all: (...p) => statement.all(...p),
        run: (...p) => statement.run(...p),
      };
    },
  };
}

test('встроенная база: регистрация, вход, карта, абонемент и заявки без сервера', async () => {
  const db = expoLikeDb();
  migrate(db);
  const { books } = JSON.parse(readFileSync(new URL('../data/books.json', import.meta.url)));
  seed(db, { books, newId: security.newId });
  let code = null;
  const transport = JSON.parse(readFileSync(new URL('../data/almaty-bus-routes.json', import.meta.url)));
  const call = createRouter(db, { security, transport, onResetCode: (_c, c) => (code = c) });
  const q = { get: () => null };

  const reg = await call({ method: 'POST', path: '/api/auth/register', query: q, body: { contact: 'local@example.com', password: 'Passw0rd123', passwordConfirm: 'Passw0rd123', firstName: 'Тест', lastName: 'Тестов', university: 'ALT', faculty: 'ИТ', program: 'ПО', group: 'IT-1', course: 1 } });
  assert.equal(reg.status, 201);
  const login = await call({ method: 'POST', path: '/api/auth/login', query: q, body: { contact: 'local@example.com', password: 'Passw0rd123' } });
  assert.equal(login.status, 200);
  assert.equal((await call({ method: 'POST', path: '/api/auth/login', query: q, body: { contact: 'local@example.com', password: 'wrong123' } })).status, 401);
  const token = login.data.token;

  for (const path of ['/api/me', '/api/books', '/api/menu', '/api/info', '/api/dorms', '/api/students', '/api/requests', '/api/membership', '/api/payment-methods', '/api/transport/routes', '/api/plans']) {
    const res = await call({ method: 'GET', path, query: q, token });
    assert.equal(res.status, 200, path);
  }

  const card = await call({ method: 'POST', path: '/api/payment-methods', query: q, token, body: { mode: 'test', holder: 'TEST USER', last4: '4242', expMonth: '12', expYear: '2030' } });
  assert.equal(card.status, 201);
  assert.equal((await call({ method: 'GET', path: '/api/payment-methods', query: q, token })).data.cards.length, 1);

  await call({ method: 'POST', path: '/api/membership', query: q, token, body: { planId: 'month' } });
  assert.equal((await call({ method: 'GET', path: '/api/membership/history', query: q, token })).data.items.length, 1);

  await call({ method: 'POST', path: '/api/auth/forgot', query: q, body: { contact: 'local@example.com' } });
  assert.equal(code, '123456');
});
