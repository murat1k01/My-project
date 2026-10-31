import type { TranslationKey } from '../i18n/translations';
import type { Subscription } from '../types/Campus';

/**
 * ПРИМЕР тарифов подписки ALTushki Plus. Оплата не подключена — оформление работает в демо-режиме.
 * Что даёт подписка (и что реально работает в приложении):
 *  - бесплатная доставка из столовой;
 *  - значок Plus в профиле.
 */
export type SubscriptionPlan = {
  id: string;
  name: TranslationKey;
  price: number;
  durationDays: number;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'month', name: 'subPlanMonth', price: 1500, durationDays: 30 },
  { id: 'semester', name: 'subPlanSemester', price: 5000, durationDays: 120 },
  { id: 'year', name: 'subPlanYear', price: 9000, durationDays: 270 },
];

export function getSubscriptionPlan(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}

export function isSubscriptionActive(subscription: Subscription | null, now: Date): subscription is Subscription {
  return subscription !== null && new Date(subscription.endsAt) > now;
}
