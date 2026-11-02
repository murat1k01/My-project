import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../api/types';
import { isServiceId } from '../data/services';
import type { Language } from '../i18n/translations';
import type { ThemeMode } from '../theme/colors';
import type { FontScaleId } from '../theme/FontScaleContext';
import { CampusState, EMPTY_CAMPUS_STATE } from '../types/Campus';
import type { ServiceId } from '../types/Service';

/**
 * Централизованная работа с AsyncStorage.
 * AsyncStorage НЕ является защищённым хранилищем: токен сессии лежит в tokenStore, пароли не хранятся нигде.
 * Все функции перехватывают ошибки: чтение возвращает значение по умолчанию,
 * запись возвращает false.
 */
export const STORAGE_KEYS = {
  favorites: '@campushub/favorites',
  theme: '@campushub/theme',
  language: '@campushub/language',
  campus: '@campushub/campus',
  fontScale: '@campushub/font-scale',
  user: '@campushub/user',
} as const;

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] Не удалось прочитать ${key}`, error);
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] Не удалось сохранить ${key}`, error);
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ---------- Последний профиль: чтобы показать его без интернета ----------

export async function loadCachedUser(): Promise<User | null> {
  const value = await readJson(STORAGE_KEYS.user);
  return isRecord(value) && typeof value.id === 'string' ? (value as User) : null;
}

export function saveCachedUser(user: User): Promise<boolean> {
  // Фото может быть большим, а на экране без сети оно не обязательно
  return writeJson(STORAGE_KEYS.user, { ...user, photo: null });
}

export async function clearCachedUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.user);
  } catch (error) {
    console.warn('[storage] Не удалось удалить профиль', error);
  }
}

// ---------- Избранные сервисы ----------

export async function loadFavorites(): Promise<ServiceId[]> {
  const value = await readJson(STORAGE_KEYS.favorites);
  return Array.isArray(value) ? value.filter(isServiceId) : [];
}

export function saveFavorites(favorites: ServiceId[]): Promise<boolean> {
  return writeJson(STORAGE_KEYS.favorites, favorites);
}

// ---------- Тема, язык и размер текста ----------

export async function loadTheme(): Promise<ThemeMode | null> {
  const value = await readJson(STORAGE_KEYS.theme);
  return value === 'light' || value === 'dark' ? value : null;
}

export function saveTheme(mode: ThemeMode): Promise<boolean> {
  return writeJson(STORAGE_KEYS.theme, mode);
}

export async function loadLanguage(): Promise<Language | null> {
  const value = await readJson(STORAGE_KEYS.language);
  return value === 'ru' || value === 'kk' || value === 'en' ? value : null;
}

export function saveLanguage(language: Language): Promise<boolean> {
  return writeJson(STORAGE_KEYS.language, language);
}

export async function loadFontScale(): Promise<FontScaleId | null> {
  const value = await readJson(STORAGE_KEYS.fontScale);
  return value === 'small' || value === 'standard' || value === 'large' || value === 'xlarge' ? value : null;
}

export function saveFontScale(id: FontScaleId): Promise<boolean> {
  return writeJson(STORAGE_KEYS.fontScale, id);
}

// ---------- Личные отметки в сервисах ----------

/**
 * Читает отметки. Каждое поле проверяется отдельно:
 * если оно повреждено, используется значение по умолчанию, а остальные данные сохраняются.
 */
export async function loadCampus(): Promise<CampusState> {
  const value = await readJson(STORAGE_KEYS.campus);
  if (!isRecord(value)) return EMPTY_CAMPUS_STATE;

  const strings = (field: unknown): string[] => (Array.isArray(field) ? field.filter((item): item is string => typeof item === 'string') : []);

  const cart: Record<string, number> = {};
  if (isRecord(value.cart)) {
    for (const [dishId, qty] of Object.entries(value.cart)) {
      if (typeof qty === 'number' && qty > 0) cart[dishId] = qty;
    }
  }

  const seat = value.seat;
  return {
    seat: isRecord(seat) && typeof seat.seatId === 'string' && typeof seat.date === 'string' ? { seatId: seat.seatId, date: seat.date } : null,
    doneTasks: strings(value.doneTasks),
    cart,
    enrolledSections: strings(value.enrolledSections),
  };
}

export function saveCampus(state: CampusState): Promise<boolean> {
  return writeJson(STORAGE_KEYS.campus, state);
}
