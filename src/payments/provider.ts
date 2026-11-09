import { Platform } from 'react-native';
import type { CardForm } from '../utils/card';
import { cardDigits } from '../utils/card';

/**
 * Привязка карты через CloudPayments (работает с картами Казахстана).
 * Номер карты и CVV никогда не попадают на сервер ALTushki: скрипт провайдера шифрует их в «криптограмму»,
 * которую может расшифровать только CloudPayments. Сервер по криптограмме получает у провайдера токен карты.
 *
 * Что нужно настроить:
 *  1. Договор с CloudPayments и публичный идентификатор сайта: EXPO_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID в .env приложения.
 *  2. На сервере CLOUDPAYMENTS_PUBLIC_ID и CLOUDPAYMENTS_API_SECRET (секрет хранится только на сервере).
 *  3. На телефоне — нативный SDK CloudPayments в отдельной сборке (EAS); в Expo Go привязка недоступна.
 */
const PUBLIC_ID = process.env.EXPO_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID ?? '';
const CHECKOUT_SCRIPT = 'https://checkout.cloudpayments.ru/checkout.js';

export class PaymentsNotConfigured extends Error {}

export const paymentsConfigured = () => PUBLIC_ID !== '' && Platform.OS === 'web';

type CloudPaymentsCheckout = { createPaymentCryptogram: (fields: Record<string, string>) => Promise<string> };
type CloudPaymentsGlobal = { Checkout: new (options: { publicId: string }) => CloudPaymentsCheckout };

function loadCheckoutScript(): Promise<CloudPaymentsGlobal> {
  const existing = (window as unknown as { cp?: CloudPaymentsGlobal }).cp;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.onload = () => {
      const cp = (window as unknown as { cp?: CloudPaymentsGlobal }).cp;
      if (cp) resolve(cp);
      else reject(new Error('CloudPayments script did not load'));
    };
    script.onerror = () => reject(new Error('CloudPayments script did not load'));
    document.head.appendChild(script);
  });
}

/** Шифрует данные карты на стороне провайдера. Возвращает криптограмму; сами данные карты дальше не передаются. */
export async function createCardCryptogram(card: CardForm): Promise<string> {
  if (!paymentsConfigured()) throw new PaymentsNotConfigured();
  const cp = await loadCheckoutScript();
  const checkout = new cp.Checkout({ publicId: PUBLIC_ID });
  return checkout.createPaymentCryptogram({
    cardNumber: cardDigits(card.number),
    expDateMonth: card.month,
    expDateYear: card.year.slice(-2),
    cvv: card.cvv,
  });
}
