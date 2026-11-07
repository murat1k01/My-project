import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FavoriteNotice, SaveResult } from './favoritesSql';

export type { FavoriteNotice, SaveResult } from './favoritesSql';

/**
 * Веб-версия хранилища. SQLite в браузере требует особых заголовков сервера, которых нет
 * у артефакта и обычного хостинга, поэтому здесь те же функции и тот же порядок сортировки
 * поверх хранилища браузера. На телефоне используется favorites.ts с настоящим SQLite.
 */
const KEY = '@campushub/favorite-notices';

type Stored = FavoriteNotice & { savedAt: string };

async function readAll(): Promise<Stored[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Stored[]) : [];
}

const writeAll = (items: Stored[]) => AsyncStorage.setItem(KEY, JSON.stringify(items));

export async function saveFavorite(notice: Pick<FavoriteNotice, 'id' | 'title' | 'body'>): Promise<SaveResult> {
  const items = await readAll();
  if (items.some((item) => item.id === notice.id)) return 'exists';
  await writeAll([...items, { ...notice, isRead: 0, savedAt: new Date().toISOString() }]);
  return 'saved';
}

export async function loadFavorites(): Promise<FavoriteNotice[]> {
  const items = await readAll();
  return items
    .sort((a, b) => a.isRead - b.isRead || b.savedAt.localeCompare(a.savedAt))
    .map(({ id, title, body, isRead }) => ({ id, title, body, isRead }));
}

export async function toggleFavoriteRead(id: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.map((item) => (item.id === id ? { ...item, isRead: item.isRead === 0 ? 1 : 0 } : item)));
}

export async function deleteFavorite(id: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.filter((item) => item.id !== id));
}
