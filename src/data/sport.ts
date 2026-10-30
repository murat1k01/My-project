import { LocalizedText, lt } from '../i18n/localized';
import type { IoniconName } from '../types/Service';

/**
 * ПРИМЕР абонементов и секций спорткомплекса. Важно заменить реальными ценами и расписанием.
 */
export type MembershipPlan = {
  id: string;
  name: LocalizedText;
  price: number;
  durationDays: number;
  features: LocalizedText[];
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'single',
    name: lt('Разовое посещение', 'Бір реттік келу', 'Single visit'),
    price: 1500,
    durationDays: 1,
    features: [lt('Тренажёрный зал на 1 день', 'Тренажер залы 1 күнге', 'Gym for 1 day')],
  },
  {
    id: 'month',
    name: lt('Месяц', 'Ай', 'Month'),
    price: 8000,
    durationDays: 30,
    features: [
      lt('Безлимитный тренажёрный зал', 'Шексіз тренажер залы', 'Unlimited gym'),
      lt('Все спортивные секции', 'Барлық спорт секциялары', 'All sports sections'),
    ],
  },
  {
    id: 'semester',
    name: lt('Семестр', 'Семестр', 'Semester'),
    price: 30000,
    durationDays: 120,
    features: [
      lt('Безлимитный тренажёрный зал', 'Шексіз тренажер залы', 'Unlimited gym'),
      lt('Все спортивные секции', 'Барлық спорт секциялары', 'All sports sections'),
      lt('2 консультации тренера', 'Жаттықтырушының 2 кеңесі', '2 coach consultations'),
    ],
  },
];

export const SPORT_HOURS: { days: LocalizedText; time: string }[] = [
  { days: lt('Пн–Пт', 'Дс–Жм', 'Mon–Fri'), time: '07:00–22:00' },
  { days: lt('Суббота', 'Сенбі', 'Saturday'), time: '09:00–20:00' },
  { days: lt('Воскресенье', 'Жексенбі', 'Sunday'), time: '10:00–18:00' },
];

export type SportSection = {
  id: string;
  name: LocalizedText;
  schedule: LocalizedText;
  coach: string;
  icon: IoniconName;
};

export const SPORT_SECTIONS: SportSection[] = [
  { id: 'gym', name: lt('Тренажёрный зал', 'Тренажер залы', 'Gym'), schedule: lt('Ежедневно · 07:00–22:00', 'Күн сайын · 07:00–22:00', 'Daily · 07:00–22:00'), coach: 'Касымов Е.Б.', icon: 'barbell-outline' },
  { id: 'volleyball', name: lt('Волейбол', 'Волейбол', 'Volleyball'), schedule: lt('Пн, Ср, Пт · 18:00–19:30', 'Дс, Ср, Жм · 18:00–19:30', 'Mon, Wed, Fri · 18:00–19:30'), coach: 'Абдрахманова Л.С.', icon: 'tennisball-outline' },
  { id: 'basketball', name: lt('Баскетбол', 'Баскетбол', 'Basketball'), schedule: lt('Вт, Чт · 17:00–18:30', 'Сс, Бс · 17:00–18:30', 'Tue, Thu · 17:00–18:30'), coach: 'Петров А.И.', icon: 'basketball-outline' },
  { id: 'football', name: lt('Мини-футбол', 'Мини-футбол', 'Futsal'), schedule: lt('Ср, Сб · 16:00–17:30', 'Ср, Сн · 16:00–17:30', 'Wed, Sat · 16:00–17:30'), coach: 'Тулегенов Н.А.', icon: 'football-outline' },
  { id: 'boxing', name: lt('Бокс', 'Бокс', 'Boxing'), schedule: lt('Пн, Чт · 19:00–20:30', 'Дс, Бс · 19:00–20:30', 'Mon, Thu · 19:00–20:30'), coach: 'Серикбаев М.К.', icon: 'fitness-outline' },
  { id: 'yoga', name: lt('Йога', 'Йога', 'Yoga'), schedule: lt('Вт, Сб · 09:00–10:00', 'Сс, Сн · 09:00–10:00', 'Tue, Sat · 09:00–10:00'), coach: 'Ли А.В.', icon: 'body-outline' },
];

/** Недельный режим тренировок в зале (индекс как у Date.getDay(): 0 — воскресенье). */
export const TRAINING_PLAN: LocalizedText[] = [
  lt('Отдых и восстановление', 'Демалыс және қалпына келу', 'Rest and recovery'),
  lt('Грудь и трицепс · 60 мин', 'Кеуде және трицепс · 60 мин', 'Chest and triceps · 60 min'),
  lt('Кардио и пресс · 45 мин', 'Кардио және іш бұлшықеті · 45 мин', 'Cardio and abs · 45 min'),
  lt('Спина и бицепс · 60 мин', 'Арқа және бицепс · 60 мин', 'Back and biceps · 60 min'),
  lt('Растяжка и мобильность · 30 мин', 'Созылу және қозғалғыштық · 30 мин', 'Stretching and mobility · 30 min'),
  lt('Ноги и плечи · 60 мин', 'Аяқ және иық · 60 мин', 'Legs and shoulders · 60 min'),
  lt('Игровые виды спорта · 90 мин', 'Ойын түрлері · 90 мин', 'Team sports · 90 min'),
];

export function getPlan(id: string): MembershipPlan | undefined {
  return MEMBERSHIP_PLANS.find((plan) => plan.id === id);
}
