import type { TranslationKey } from '../i18n/translations';
import type { StudentDraft } from '../types/Student';
import { isValidPhone, normalizePhone, normalizeText } from './format';

export const LOGIN_MIN_LENGTH = 4;
export const PASSWORD_MIN_LENGTH = 8;

/** Ошибки хранятся как ключи перевода — текст показывается на выбранном языке. */
export type LoginErrors = {
  login?: TranslationKey;
  password?: TranslationKey;
};

export type StudentErrors = Partial<Record<keyof StudentDraft, TranslationKey>>;

// Латиница, кириллица (включая казахские буквы), цифры, точка, дефис, подчёркивание.
const LOGIN_PATTERN = /^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі0-9._-]+$/;

export function validateLogin(login: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const trimmedLogin = login.trim();

  if (!trimmedLogin) errors.login = 'errLoginRequired';
  else if (trimmedLogin.length < LOGIN_MIN_LENGTH) errors.login = 'errLoginShort';
  else if (!LOGIN_PATTERN.test(trimmedLogin)) errors.login = 'errLoginChars';

  // Пароль не обрезаем: пробелы могут быть его частью.
  if (!password) errors.password = 'errPasswordRequired';
  else if (password.length < PASSWORD_MIN_LENGTH) errors.password = 'errPasswordShort';

  return errors;
}

/**
 * Обязателен только телефон. Имя, группа, специальность и остальные поля
 * необязательны — проверяется лишь их максимальная длина.
 */
export function validateStudent(draft: StudentDraft): StudentErrors {
  const errors: StudentErrors = {};

  if (!draft.phone.trim()) errors.phone = 'errPhoneRequired';
  else if (!isValidPhone(draft.phone)) errors.phone = 'errPhoneInvalid';

  if (normalizeText(draft.firstName).length > 40) errors.firstName = 'errFirstNameLong';
  if (normalizeText(draft.lastName).length > 40) errors.lastName = 'errLastNameLong';
  if (normalizeText(draft.group).length > 20) errors.group = 'errGroupLong';
  if (normalizeText(draft.program).length > 80) errors.program = 'errProgramLong';

  return errors;
}

/** Нормализует введённые значения перед сохранением. */
export function cleanStudentDraft(draft: StudentDraft): StudentDraft {
  return {
    firstName: normalizeText(draft.firstName),
    lastName: normalizeText(draft.lastName),
    group: normalizeText(draft.group).toUpperCase(),
    program: normalizeText(draft.program),
    faculty: normalizeText(draft.faculty),
    course: normalizeText(draft.course),
    phone: normalizePhone(draft.phone),
  };
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
