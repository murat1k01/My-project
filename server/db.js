// База данных SQLite (встроена в Node.js 22+). Файл базы создаётся автоматически.
import { DatabaseSync } from 'node:sqlite';
import { seed } from './seed.js';

const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  university TEXT NOT NULL,
  faculty TEXT NOT NULL,
  program TEXT NOT NULL,
  group_name TEXT NOT NULL,
  course INTEGER NOT NULL,
  photo TEXT,
  show_in_directory INTEGER NOT NULL DEFAULT 1,
  show_phone INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('university', 'faculty', 'program', 'group')),
  name TEXT NOT NULL,
  UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT,
  year INTEGER,
  category TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  source_url TEXT,
  read_url TEXT,
  copies INTEGER
);

-- Избранное: книги, блюда, маршруты и остановки
CREATE TABLE IF NOT EXISTS user_items (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('book', 'dish', 'route', 'stop')),
  item_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, kind, item_id)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  available INTEGER NOT NULL DEFAULT 1,
  allergens TEXT,
  image_key TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lines TEXT NOT NULL,
  total INTEGER NOT NULL,
  delivery TEXT NOT NULL CHECK (delivery IN ('delivery', 'pickup')),
  address TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'cooking', 'ready', 'delivering', 'done', 'canceled')),
  eta_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'plus')),
  canceled INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Студенты, которых пользователь добавил сам. Запись видит только он.
CREATE TABLE IF NOT EXISTS student_contacts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  faculty TEXT,
  program TEXT,
  group_name TEXT,
  course INTEGER,
  phone TEXT,
  created_at TEXT NOT NULL
);

-- Абонементы спорткомплекса: заявка, которую подтверждает администратор после оплаты на месте
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled')),
  expires_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS info_pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dorms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  contacts TEXT,
  services TEXT,
  rules TEXT,
  hours TEXT
);

CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  dorm_id TEXT NOT NULL REFERENCES dorms(id) ON DELETE CASCADE,
  floor INTEGER,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'maintenance'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  slot TEXT NOT NULL,
  canceled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Заявки: ремонт в общежитии и отклики студентам. Статус меняет администратор, история хранит даты.
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('repair', 'response', 'application')),
  category TEXT,
  target_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'decision', 'resolved')),
  history TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Главная защита от двойного бронирования: база сама не даст создать две активные брони на один интервал
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_conflict ON bookings (machine_id, date, slot) WHERE canceled = 0;
`;

export function openDatabase(path, options) {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  seed(db, options);
  return db;
}
