// Запуск сервера Campus Hub: npm run server
// Настройка через переменные окружения (см. server/.env.example). Секреты не хранятся в коде.
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createApi } from './api.js';
import { openDatabase } from './db.js';

const PORT = Number(process.env.PORT ?? 3000);
const DB_PATH = process.env.DB_PATH ?? fileURLToPath(new URL('./data/campus.db', import.meta.url));

const db = openDatabase(DB_PATH, { demoDorm: process.env.SEED_DEMO_DORM !== '0' });

// Назначить администратора: node server/index.js --make-admin email@example.com
const adminArg = process.argv.indexOf('--make-admin');
if (adminArg !== -1) {
  const email = String(process.argv[adminArg + 1] ?? '').toLowerCase();
  const { changes } = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
  console.log(changes ? `${email} теперь администратор` : `Пользователь ${email} не найден. Сначала зарегистрируйтесь.`);
  process.exit(changes ? 0 : 1);
}

const handler = createApi(db, { adminEmail: process.env.ADMIN_EMAIL ?? null, positionsUrl: process.env.BUS_POSITIONS_URL ?? null });

createServer(handler).listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер Campus Hub запущен: http://localhost:${PORT}/api/health`);
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal) console.log(`С телефона в той же Wi-Fi: http://${net.address}:${PORT}`);
    }
  }
});
