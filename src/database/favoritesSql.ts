/**
 * SQL-запросы таблицы избранных объявлений. Вынесены отдельно, чтобы те же запросы
 * проверялись тестом сервера на настоящей базе SQLite. Значения передаются только параметрами «?».
 */
export const CREATE_FAVORITES_TABLE = `
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  isRead INTEGER NOT NULL DEFAULT 0 CHECK (isRead IN (0, 1)),
  savedAt TEXT NOT NULL
);`;

/** Повторное сохранение того же id ничего не добавляет: changes будет 0 */
export const INSERT_FAVORITE = 'INSERT OR IGNORE INTO favorites (id, title, body, isRead, savedAt) VALUES (?, ?, ?, 0, ?)';

/** Сначала непрочитанные, внутри групп — последние сохранённые */
export const SELECT_FAVORITES = 'SELECT id, title, body, isRead FROM favorites ORDER BY isRead ASC, savedAt DESC';

export const TOGGLE_READ = 'UPDATE favorites SET isRead = CASE isRead WHEN 0 THEN 1 ELSE 0 END WHERE id = ?';

export const DELETE_FAVORITE = 'DELETE FROM favorites WHERE id = ?';

export type FavoriteNotice = {
  id: string;
  title: string;
  body: string;
  /** 0 — не прочитано, 1 — прочитано */
  isRead: 0 | 1;
};

/** saved — добавлено, exists — уже было сохранено раньше */
export type SaveResult = 'saved' | 'exists';
