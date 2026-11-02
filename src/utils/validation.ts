import type { TranslationKey } from '../i18n/translations';

/**
 * Проверка форм на устройстве нужна только для быстрых подсказок.
 * Те же правила повторно проверяет сервер, и его решение окончательное.
 */
export const PASSWORD_MIN_LENGTH = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidContact(value: string): boolean {
  const text = value.trim();
  if (EMAIL.test(text)) return true;
  const digits = text.replace(/[\s()+-]/g, '');
  return /^\d{10,11}$/.test(digits);
}

export function passwordError(password: string): TranslationKey | undefined {
  if (!password) return 'errPasswordRequired';
  if (password.length < PASSWORD_MIN_LENGTH) return 'errPasswordShort';
  if (!/[A-Za-zА-Яа-яЁё]/.test(password) || !/\d/.test(password)) return 'errPasswordWeak';
  return undefined;
}

export type ProfileErrors = Partial<Record<'firstName' | 'lastName' | 'university' | 'faculty' | 'program' | 'group' | 'course', TranslationKey>>;

export function validateProfile(draft: { firstName: string; lastName: string; university: string; faculty: string; program: string; group: string; course: number | string }): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!draft.firstName.trim()) errors.firstName = 'errFirstNameRequired';
  if (!draft.lastName.trim()) errors.lastName = 'errLastNameRequired';
  if (!draft.university.trim()) errors.university = 'errUniversityRequired';
  if (!draft.faculty.trim()) errors.faculty = 'errFacultyRequired';
  if (!draft.program.trim()) errors.program = 'errProgramRequired';
  if (!draft.group.trim()) errors.group = 'errGroupRequired';
  if (!Number(draft.course)) errors.course = 'errCourseRequired';
  return errors;
}

export const hasErrors = (errors: object): boolean => Object.values(errors).some(Boolean);
