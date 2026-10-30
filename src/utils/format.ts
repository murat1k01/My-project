import { dateNames, Language } from '../i18n/translations';
import type { Student } from '../types/Student';

/** Убирает пробелы по краям и схлопывает повторяющиеся пробелы внутри строки. */
export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getFullName(student: Pick<Student, 'firstName' | 'lastName'>): string {
  return normalizeText(`${student.firstName} ${student.lastName}`);
}

export function getInitials(firstName: string, lastName: string): string {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return initials || '?';
}

/** Поиск по имени и фамилии без учёта регистра и лишних пробелов. */
export function matchesStudentQuery(student: Student, query: string): boolean {
  const normalizedQuery = normalizeText(query).toLowerCase();
  if (!normalizedQuery) return true;
  const direct = getFullName(student).toLowerCase();
  const reversed = normalizeText(`${student.lastName} ${student.firstName}`).toLowerCase();
  return direct.includes(normalizedQuery) || reversed.includes(normalizedQuery);
}

// ---------- Деньги ----------

/** 2450 → «2 450 ₸» (неразрывные пробелы, чтобы сумма не переносилась) */
export function formatTenge(amount: number): string {
  const digits = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${digits} ₸`;
}

// ---------- Даты и время ----------
// Названия месяцев берём из своих словарей, а не из Intl: так одинаково работает на всех устройствах.

const pad = (value: number) => String(value).padStart(2, '0');

/** «30 октября» / «30 қазан» / «30 October» */
export function formatDayMonth(date: Date, language: Language): string {
  const month = dateNames[language].months[date.getMonth()];
  return language === 'en' ? `${month} ${date.getDate()}` : `${date.getDate()} ${month}`;
}

/** «Пятница, 30 октября» */
export function formatToday(date: Date, language: Language): string {
  return `${dateNames[language].weekdays[date.getDay()]}, ${formatDayMonth(date, language)}`;
}

/** «30 октября 2026» */
export function formatDate(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatDayMonth(date, language)} ${date.getFullYear()}`;
}

/** «30 октября, 21:43» */
export function formatDateTime(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatDayMonth(date, language)}, ${formatClock(date)}`;
}

export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Ключ дня в формате YYYY-MM-DD (по местному времени) */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** «08:30» → 510 минут от начала суток */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** 510 → «08:30» */
export function fromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Ключ приветствия по времени суток */
export function getGreetingKey(date: Date) {
  const hour = date.getHours();
  if (hour < 6) return 'greetingNight' as const;
  if (hour < 12) return 'greetingMorning' as const;
  if (hour < 18) return 'greetingDay' as const;
  return 'greetingEvening' as const;
}

// ---------- Разное ----------

const AVATAR_COLORS = ['#2F6BFF', '#0EA5E9', '#6366F1', '#10B981', '#F43F5E', '#8B5CF6', '#F59E0B', '#EC4899'];

/** Стабильное число из строки — для цвета аватара и «случайной» занятости мест. */
export function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickAvatarColor(seed: string): string {
  return AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];
}
