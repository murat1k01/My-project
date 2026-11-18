import { getRandomBytes } from 'expo-crypto';
import { openDatabaseSync, type SQLiteBindValue } from 'expo-sqlite';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { sha256 as sha256Bytes } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { createRouter, type RouterResponse, type Security, type SqlDatabase } from '../../../server/core/router';
import { migrate } from '../../../server/core/schema';
import { seed } from '../../../server/core/seed';
import { BOOK_COVERS } from '../../data/bookCovers';
import booksFile from '../../../server/data/books.json';
import transport from '../../../server/data/almaty-bus-routes.json';

/**
 * Встроенная SQL-база приложения (SQLite на телефоне).
 * Логика та же, что на сервере (server/core): те же таблицы, проверки и ответы,
 * поэтому все разделы работают без интернета и без запущенного компьютера.
 */

const SCRYPT = { N: 16384, r: 8, p: 1, dkLen: 64 };

const security: Security = {
  async hashPassword(password) {
    const salt = getRandomBytes(16);
    const hash = await scryptAsync(utf8ToBytes(password), salt, { ...SCRYPT, asyncTick: 20 });
    return `scrypt$${bytesToHex(salt)}$${bytesToHex(hash)}`;
  },
  async verifyPassword(password, stored) {
    const [scheme, saltHex, hashHex] = String(stored).split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = hexToBytes(hashHex);
    const actual = await scryptAsync(utf8ToBytes(password), hexToBytes(saltHex), { ...SCRYPT, dkLen: expected.length, asyncTick: 20 });
    // Сравнение без раннего выхода: время не зависит от того, где различие
    let diff = actual.length ^ expected.length;
    for (let i = 0; i < expected.length; i += 1) diff |= actual[i] ^ expected[i];
    return diff === 0;
  },
  sha256: (value) => bytesToHex(sha256Bytes(utf8ToBytes(value))),
  newToken: () => bytesToHex(getRandomBytes(32)),
  newResetCode: () => {
    const [a, b, c] = getRandomBytes(3);
    return String(100000 + (((a << 16) | (b << 8) | c) % 900000));
  },
  newId: () => bytesToHex(getRandomBytes(9)),
};

let dispatch: ReturnType<typeof createRouter> | null = null;
let lastResetCode: string | null = null;

function open() {
  if (dispatch) return dispatch;
  const sqlite = openDatabaseSync('altushki.db');
  const values = (params: unknown[]) => params as SQLiteBindValue[];
  // Тот же интерфейс, что у node:sqlite, чтобы общий код работал без изменений
  const db: SqlDatabase = {
    exec: (sql) => sqlite.execSync(sql),
    prepare: (sql) => ({
      get: (...params) => sqlite.getFirstSync<Record<string, unknown>>(sql, values(params)) ?? undefined,
      all: (...params) => sqlite.getAllSync<Record<string, unknown>>(sql, values(params)),
      run: (...params) => {
        const result = sqlite.runSync(sql, values(params));
        return { changes: result.changes, lastInsertRowid: result.lastInsertRowId };
      },
    }),
  };
  migrate(db);
  seed(db, { books: (booksFile as { books: unknown[] }).books, newId: security.newId });
  dispatch = createRouter(db, {
    security,
    transport,
    hasCover: (name) => name in BOOK_COVERS,
    // На телефоне нет почты: код восстановления показывается на экране владельцу устройства
    onResetCode: (_contact, code) => {
      lastResetCode = code;
    },
  });
  return dispatch;
}

function parseQuery(search: string) {
  const map = new Map<string, string>();
  for (const part of search.split('&')) {
    if (!part) continue;
    const [key, value = ''] = part.split('=');
    map.set(decodeURIComponent(key.replace(/\+/g, ' ')), decodeURIComponent(value.replace(/\+/g, ' ')));
  }
  return { get: (name: string) => map.get(name) ?? null };
}

export const LOCAL_AVAILABLE = true;

/** Выполняет запрос к встроенной базе. Ответ в том же виде, что у сервера. */
export async function localRequest(method: string, fullPath: string, token: string | null, body: unknown): Promise<RouterResponse> {
  const [path, search = ''] = fullPath.split('?');
  // JSON-круг: в базу попадают те же данные, что пришли бы по сети
  const payload = body === undefined ? {} : JSON.parse(JSON.stringify(body));
  lastResetCode = null;
  const response = await open()({ method, path, query: parseQuery(search), token, body: payload, ip: 'device' });
  if (path === '/api/auth/forgot' && lastResetCode && response.status === 200) {
    return { ...response, data: { ...(response.data as object), localCode: lastResetCode } };
  }
  return response;
}
