import type { TranslationKey } from '../i18n/translations';

/**
 * Проверка карты для тестовой привязки: номер — любые 16 цифр.
 * На сервер уходят только последние 4 цифры, срок и имя; полный номер и CVV не передаются и не сохраняются.
 */
export type CardForm = { number: string; month: string; year: string; holder: string; cvv: string };
export type CardErrors = Partial<Record<keyof CardForm, TranslationKey>>;

export const cardDigits = (value: string) => value.replace(/\D/g, '');

/** 1234567812345678 → «1234 5678 1234 5678» */
export const formatCardNumber = (value: string) =>
  cardDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

export function validateCard(form: CardForm, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  if (!/^\d{16}$/.test(cardDigits(form.number))) errors.number = 'payErrNumber';

  const month = Number(form.month);
  const year = Number(form.year);
  if (!/^\d{2}$/.test(form.month) || month < 1 || month > 12) errors.month = 'payErrMonth';
  if (!/^\d{4}$/.test(form.year)) errors.year = 'payErrYear';
  // Карта действует до конца указанного месяца
  else if (!errors.month && (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))) errors.year = 'payErrExpired';

  if (form.holder.trim().length < 3) errors.holder = 'payErrHolder';
  if (!/^\d{3}$/.test(form.cvv)) errors.cvv = 'payErrCvv';
  return errors;
}
