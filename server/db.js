// База данных SQLite (встроена в Node.js 22+). Файл базы создаётся автоматически.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { migrate } from './core/schema.js';
import { seed } from './core/seed.js';
import { newId } from './security.js';

export function openDatabase(path, options = {}) {
  const db = new DatabaseSync(path);
  migrate(db);
  const { books } = JSON.parse(readFileSync(new URL('./data/books.json', import.meta.url)));
  seed(db, { ...options, books, newId });
  return db;
}
