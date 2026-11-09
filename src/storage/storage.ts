import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../api/types';
import { isServiceId } from '../data/services';
import type { Language } from '../i18n/translations';
import type { ThemeMode } from '../theme/colors';
import type { Vitals } from '../data/vitals';
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

/** Прежние версии хранили размер словом: переводим его в число */
const LEGACY_FONT_SCALES: Record<string, number> = { small: 0.88, standard: 1, large: 1.15, xlarge: 1.3 };

export async function loadFontScale(): Promise<number | null> {
  const value = await readJson(STORAGE_KEYS.fontScale);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return typeof value === 'string' ? (LEGACY_FONT_SCALES[value] ?? null) : null;
}

export function saveFontScale(scale: number): Promise<boolean> {
  return writeJson(STORAGE_KEYS.fontScale, scale);
}

// ---------- Последний логин: только email или телефон, пароль не хранится ----------

const LAST_LOGIN_KEY = '@campushub/last-login';

export async function loadLastLogin(): Promise<string | null> {
  const value = await readJson(LAST_LOGIN_KEY);
  return typeof value === 'string' ? value : null;
}

export function saveLastLogin(contact: string | null): Promise<boolean> {
  return contact ? writeJson(LAST_LOGIN_KEY, contact) : removeKey(LAST_LOGIN_KEY);
}

async function removeKey(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[storage] Не удалось удалить ${key}`, error);
    return false;
  }
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
    vitals: readVitals(value.vitals),
    health: value.health === 'healthy' || value.health === 'limited' || value.health === 'exempt' ? value.health : null,
  };
}

/** Показатели здоровья: берём только известные числовые поля */
function readVitals(value: unknown): Vitals {
  if (!isRecord(value)) return {};
  const vitals: Vitals = {};
  for (const key of ['pulse', 'sleep', 'steps', 'water', 'activity'] as const) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) vitals[key] = value[key] as number;
  }
  if (typeof value.updatedAt === 'string') vitals.updatedAt = value.updatedAt;
  return vitals;
}

export function saveCampus(state: CampusState): Promise<boolean> {
  return writeJson(STORAGE_KEYS.campus, state);
}
