import type { TranslationKey } from '../i18n/translations';

/** Проверка данных карты Visa перед передачей платёжному провайдеру. Сами данные карты нигде не сохраняются. */
export type CardForm = { number: string; month: string; year: string; holder: string; cvv: string };
export type CardErrors = Partial<Record<keyof CardForm, TranslationKey>>;

export const cardDigits = (value: string) => value.replace(/\D/g, '');

/** 4111111111111111 → «4111 1111 1111 1111» */
export const formatCardNumber = (value: string) =>
  cardDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

/** Алгоритм Луна: отсекает опечатки в номере карты */
export function luhnValid(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return digits.length > 0 && sum % 10 === 0;
}

export function validateCard(form: CardForm, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  const digits = cardDigits(form.number);
  if (!/^4\d{15}$/.test(digits) || !luhnValid(digits)) errors.number = 'payErrNumber';

  const month = Number(form.month);
  const year = Number(form.year);
  if (!/^\d{2}$/.test(form.month) || month < 1 || month > 12) errors.month = 'payErrMonth';
  if (!/^\d{4}$/.test(form.year)) errors.year = 'payErrYear';
  // Карта действует до конца указанного месяца
  else if (!errors.month && (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))) errors.year = 'payErrExpired';

  if (!/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(form.holder.trim()) || !form.holder.trim().includes(' ')) errors.holder = 'payErrHolder';
  if (!/^\d{3}$/.test(form.cvv)) errors.cvv = 'payErrCvv';
  return errors;
}
