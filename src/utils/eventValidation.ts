import type { TranslationKey } from '../i18n/translations';

/** Лабораторная работа №9: проверка формы регистрации на мероприятие. */
export const EVENT_TYPES = ['hackathon', 'seminar', 'masterclass'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const DESCRIPTION_MAX = 200;

export type EventForm = {
  fullName: string;
  group: string;
  eventType: EventType | null;
  date: string;
  description: string;
  agreed: boolean;
};

export type EventField = keyof EventForm;
export type EventErrors = Partial<Record<EventField, TranslationKey>>;

const pad = (n: number) => String(n).padStart(2, '0');

/** Сегодняшняя дата по местному времени в виде ГГГГ-ММ-ДД */
export function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** ДД.ММ.ГГГГ → ГГГГ-ММ-ДД, чтобы даты можно было сравнивать как строки */
export function toDateKey(value: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

/** true, если такой день есть в календаре: 31.02.2026 не пройдёт */
export function isRealDate(value: string): boolean {
  const key = toDateKey(value);
  if (!key) return false;
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateEventForm(form: EventForm, now = new Date()): EventErrors {
  const errors: EventErrors = {};
  if (form.fullName.trim().length < 3) errors.fullName = 'evErrName';
  if (!form.group.trim()) errors.group = 'evErrGroup';
  if (!form.eventType) errors.eventType = 'evErrType';

  const date = form.date.trim();
  if (!toDateKey(date)) errors.date = 'evErrDateFormat';
  else if (!isRealDate(date)) errors.date = 'evErrDateInvalid';
  // Ключи ГГГГ-ММ-ДД сравниваются как даты
  else if (toDateKey(date)! < todayKey(now)) errors.date = 'evErrDatePast';

  const description = form.description.trim();
  if (description.length < 10) errors.description = 'evErrDescription';
  else if (form.description.length > DESCRIPTION_MAX) errors.description = 'evErrDescriptionLong';

  if (!form.agreed) errors.agreed = 'evErrAgree';
  return errors;
}

export const hasEventErrors = (errors: EventErrors): boolean => Object.values(errors).some(Boolean);
