// Безопасность: хеши паролей (scrypt) и случайные токены сессий.
// В базе никогда не лежат ни пароль, ни сам токен — только их хеши.
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return timingSafeEqual(actual, expected);
}

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/** Токен сессии: клиент хранит сам токен, сервер — только его SHA-256. */
export const newToken = () => randomBytes(32).toString('base64url');

export const newResetCode = () => String(randomInt(100000, 1000000));

export const newId = () => randomBytes(9).toString('base64url');
