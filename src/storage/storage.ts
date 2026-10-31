import AsyncStorage from '@react-native-async-storage/async-storage';
import { isServiceId } from '../data/services';
import type { Language } from '../i18n/translations';
import type { ThemeMode } from '../theme/colors';
import { CampusState, EMPTY_CAMPUS_STATE } from '../types/Campus';
import type { ServiceId } from '../types/Service';
import type { Session } from '../types/Session';
import type { Student } from '../types/Student';

/**
 * Централизованная работа с AsyncStorage.
 * AsyncStorage НЕ является защищённым хранилищем — пароли здесь не сохраняются.
 * Все функции перехватывают ошибки: чтение возвращает значение по умолчанию,
 * запись возвращает false.
 */
export const STORAGE_KEYS = {
  session: '@campushub/session',
  students: '@campushub/students',
  favorites: '@campushub/favorites',
  theme: '@campushub/theme',
  language: '@campushub/language',
  campus: '@campushub/campus',
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

async function removeKey(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[storage] Не удалось удалить ${key}`, error);
    return false;
  }
}

// ---------- Проверка формы сохранённых данных ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Приводит сохранённую запись к текущему типу Student.
 * Записи из прошлой версии приложения (без телефона, факультета и курса) не теряются:
 * недостающие поля становятся пустыми строками.
 */
function toStudent(value: unknown): Student | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.createdAt !== 'string') return null;
  const text = (field: unknown) => (typeof field === 'string' ? field : '');
  return {
    id: value.id,
    createdAt: value.createdAt,
    firstName: text(value.firstName),
    lastName: text(value.lastName),
    group: text(value.group),
    program: text(value.program),
    faculty: text(value.faculty),
    course: text(value.course),
    phone: text(value.phone),
  };
}

function isSession(value: unknown): value is Session {
  return isRecord(value) && typeof value.login === 'string' && typeof value.signedInAt === 'string';
}

// ---------- Сессия ----------

export async function loadSession(): Promise<Session | null> {
  const value = await readJson(STORAGE_KEYS.session);
  return isSession(value) ? value : null;
}

export function saveSession(session: Session): Promise<boolean> {
  return writeJson(STORAGE_KEYS.session, session);
}

export function clearSession(): Promise<boolean> {
  return removeKey(STORAGE_KEYS.session);
}

// ---------- Студенты ----------

export async function loadStudents(): Promise<Student[]> {
  const value = await readJson(STORAGE_KEYS.students);
  if (!Array.isArray(value)) return [];
  return value.map(toStudent).filter((student): student is Student => student !== null);
}

export function saveStudents(students: Student[]): Promise<boolean> {
  return writeJson(STORAGE_KEYS.students, students);
}

// ---------- Избранные сервисы ----------

export async function loadFavorites(): Promise<ServiceId[]> {
  const value = await readJson(STORAGE_KEYS.favorites);
  return Array.isArray(value) ? value.filter(isServiceId) : [];
}

export function saveFavorites(favorites: ServiceId[]): Promise<boolean> {
  return writeJson(STORAGE_KEYS.favorites, favorites);
}

// ---------- Тема и язык ----------

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

// ---------- Данные сервисов кампуса ----------

/**
 * Читает состояние сервисов. Каждое поле проверяется отдельно:
 * если оно повреждено, используется значение по умолчанию, а остальные данные сохраняются.
 */
export async function loadCampus(): Promise<CampusState> {
  const value = await readJson(STORAGE_KEYS.campus);
  if (!isRecord(value)) return EMPTY_CAMPUS_STATE;

  const arrayOf = <T,>(field: unknown, check: (item: unknown) => boolean): T[] =>
    Array.isArray(field) ? (field.filter(check) as T[]) : [];
  const recordOrNull = <T,>(field: unknown, keys: string[]): T | null =>
    isRecord(field) && keys.every((key) => key in field) ? (field as T) : null;

  const cart: Record<string, number> = {};
  if (isRecord(value.cart)) {
    for (const [dishId, qty] of Object.entries(value.cart)) {
      if (typeof qty === 'number' && qty > 0) cart[dishId] = qty;
    }
  }

  return {
    seat: recordOrNull(value.seat, ['seatId', 'date']),
    myRouteId: typeof value.myRouteId === 'string' ? value.myRouteId : null,
    doneTasks: arrayOf<string>(value.doneTasks, (item) => typeof item === 'string'),
    cart,
    orders: arrayOf(value.orders, (item) => isRecord(item) && typeof item.id === 'string' && Array.isArray(item.lines)),
    membership: recordOrNull(value.membership, ['planId', 'startedAt', 'endsAt']),
    enrolledSections: arrayOf<string>(value.enrolledSections, (item) => typeof item === 'string'),
    laundry: recordOrNull(value.laundry, ['machine', 'time', 'date']),
    repairs: arrayOf(value.repairs, (item) => isRecord(item) && typeof item.id === 'string'),
    guestPasses: arrayOf(value.guestPasses, (item) => isRecord(item) && typeof item.id === 'string'),
    applications: arrayOf(value.applications, (item) => isRecord(item) && typeof item.id === 'string'),
    subscription: recordOrNull(value.subscription, ['planId', 'startedAt', 'endsAt']),
  };
}

export function saveCampus(state: CampusState): Promise<boolean> {
  return writeJson(STORAGE_KEYS.campus, state);
}
