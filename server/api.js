// HTTP-сервер ALTushki. Сама логика API лежит в core/router.js:
// здесь только чтение запроса, ответ в JSON и раздача обложек книг.
import { existsSync, readFileSync } from 'node:fs';
import { createRouter, ApiError, LAUNDRY_SLOTS, PLANS } from './core/router.js';
import * as security from './security.js';

export { LAUNDRY_SLOTS, PLANS };

const MAX_BODY_BYTES = 3 * 1024 * 1024; // запас под фото профиля

const coverFile = (name) => new URL(`./data/covers/${name}`, import.meta.url);

export function createApi(db, options = {}) {
  const dispatch = createRouter(db, {
    ...options,
    security,
    transport: JSON.parse(readFileSync(new URL('./data/almaty-bus-routes.json', import.meta.url))),
    // Обложка из папки проекта надёжнее внешнего сайта, который может быть недоступен из сети пользователя
    hasCover: (name) => existsSync(coverFile(name)),
  });

  const send = (res, status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    });
    res.end(JSON.stringify(data));
  };

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
          reject(new ApiError(413, 'too_large', 'Слишком большой запрос'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        if (chunks.length === 0) return resolve({});
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve(parsed && typeof parsed === 'object' ? parsed : {});
        } catch {
          reject(new ApiError(400, 'invalid_json', 'Неверный формат запроса'));
        }
      });
      req.on('error', reject);
    });

  return async function handler(req, res) {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    const url = new URL(req.url, 'http://localhost');
    // Обложки: имя проверяется, поэтому выйти за пределы папки нельзя
    const cover = req.method === 'GET' && url.pathname.match(/^\/covers\/([\w-]+\.jpg)$/);
    if (cover && existsSync(coverFile(cover[1]))) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=604800' });
      return res.end(readFileSync(coverFile(cover[1])));
    }
    let body = {};
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        body = await readBody(req);
      } catch (error) {
        if (error instanceof ApiError) return send(res, error.status, { error: { code: error.code, message: error.message } });
        return send(res, 400, { error: { code: 'bad_request', message: 'Неверный запрос' } });
      }
    }
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const { status, data } = await dispatch({ method: req.method, path: url.pathname, query: url.searchParams, token, body, ip: req.socket.remoteAddress ?? '' });
    return send(res, status, data);
  };
}
