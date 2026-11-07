import * as SQLite from 'expo-sqlite';
import { CREATE_FAVORITES_TABLE, DELETE_FAVORITE, FavoriteNotice, INSERT_FAVORITE, SaveResult, SELECT_FAVORITES, TOGGLE_READ } from './favoritesSql';

export type { FavoriteNotice, SaveResult } from './favoritesSql';

/**
 * Объявления, сохранённые для чтения без интернета: база SQLite campus_favorites.db на устройстве.
 * Соединение открывается один раз и переиспользуется; таблица создаётся при первом обращении.
 */
let connection: Promise<SQLite.SQLiteDatabase> | null = null;

function database(): Promise<SQLite.SQLiteDatabase> {
  if (!connection) {
    connection = SQLite.openDatabaseAsync('campus_favorites.db').then(async (db) => {
      await db.execAsync(CREATE_FAVORITES_TABLE);
      return db;
    });
    // Если открыть не удалось, следующая попытка начнётся заново
    connection.catch(() => {
      connection = null;
    });
  }
  return connection;
}

export async function saveFavorite(notice: Pick<FavoriteNotice, 'id' | 'title' | 'body'>): Promise<SaveResult> {
  const db = await database();
  const result = await db.runAsync(INSERT_FAVORITE, notice.id, notice.title, notice.body, new Date().toISOString());
  return result.changes > 0 ? 'saved' : 'exists';
}

export async function loadFavorites(): Promise<FavoriteNotice[]> {
  const db = await database();
  return db.getAllAsync<FavoriteNotice>(SELECT_FAVORITES);
}

export async function toggleFavoriteRead(id: string): Promise<void> {
  const db = await database();
  await db.runAsync(TOGGLE_READ, id);
}

export async function deleteFavorite(id: string): Promise<void> {
  const db = await database();
  await db.runAsync(DELETE_FAVORITE, id);
}
