import { LocalizedText, lt } from '../i18n/localized';
import { minutesOfDay, toMinutes } from '../utils/format';

/**
 * ПРИМЕР маршрутов до кампуса. Важно заменить реальными маршрутами и расписанием города.
 */
export type BusRoute = {
  id: string;
  number: string;
  color: string;
  name: LocalizedText;
  stops: LocalizedText[];
  /** Интервал движения в минутах */
  intervalMin: number;
  first: string;
  last: string;
  /** Время в пути от первой до последней остановки */
  travelMin: number;
  fare: number;
};

const CAMPUS = lt('Кампус (главный корпус)', 'Кампус (бас ғимарат)', 'Campus (main building)');

export const BUS_ROUTES: BusRoute[] = [
  {
    id: 'r12',
    number: '12',
    color: '#2F6BFF',
    name: lt('Мкр. Самал — Кампус', 'Самал ш/а — Кампус', 'Samal district — Campus'),
    stops: [
      lt('Мкр. Самал', 'Самал ш/а', 'Samal district'),
      lt('ТРЦ «Мега»', '«Мега» СОО', 'Mega mall'),
      lt('Площадь Республики', 'Республика алаңы', 'Republic Square'),
      lt('Ж/д вокзал', 'Теміржол вокзалы', 'Railway station'),
      CAMPUS,
    ],
    intervalMin: 10,
    first: '06:30',
    last: '22:30',
    travelMin: 35,
    fare: 200,
  },
  {
    id: 'r37',
    number: '37',
    color: '#F97316',
    name: lt('Аэропорт — Кампус', 'Әуежай — Кампус', 'Airport — Campus'),
    stops: [
      lt('Аэропорт', 'Әуежай', 'Airport'),
      lt('Автовокзал', 'Автовокзал', 'Bus terminal'),
      lt('Центральный рынок', 'Орталық базар', 'Central market'),
      lt('Студгородок', 'Студенттік қалашық', 'Student town'),
      CAMPUS,
    ],
    intervalMin: 20,
    first: '06:00',
    last: '21:00',
    travelMin: 50,
    fare: 200,
  },
  {
    id: 'r63',
    number: '63',
    color: '#10B981',
    name: lt('Шаттл: общежития — Кампус', 'Шаттл: жатақханалар — Кампус', 'Shuttle: dorms — Campus'),
    stops: [
      lt('Общежитие №1', '№1 жатақхана', 'Dormitory #1'),
      lt('Общежитие №2', '№2 жатақхана', 'Dormitory #2'),
      lt('Общежитие №3', '№3 жатақхана', 'Dormitory #3'),
      lt('Спорткомплекс', 'Спорт кешені', 'Sports complex'),
      CAMPUS,
    ],
    intervalMin: 7,
    first: '07:00',
    last: '23:00',
    travelMin: 15,
    fare: 0,
  },
  {
    id: 'r92',
    number: '92',
    color: '#A855F7',
    name: lt('Мкр. Жетысу — Кампус', 'Жетісу ш/а — Кампус', 'Zhetysu district — Campus'),
    stops: [
      lt('Мкр. Жетысу', 'Жетісу ш/а', 'Zhetysu district'),
      lt('Городская больница', 'Қалалық аурухана', 'City hospital'),
      lt('Центральный парк', 'Орталық саябақ', 'Central park'),
      lt('Национальная библиотека', 'Ұлттық кітапхана', 'National library'),
      CAMPUS,
    ],
    intervalMin: 15,
    first: '06:45',
    last: '21:30',
    travelMin: 40,
    fare: 200,
  },
];

export function getRoute(id: string | null): BusRoute | undefined {
  return BUS_ROUTES.find((route) => route.id === id);
}

/** Ближайшие отправления (в минутах от начала суток) начиная с текущего времени. */
export function getNextDepartures(route: BusRoute, now: Date, count = 4): number[] {
  const first = toMinutes(route.first);
  const last = toMinutes(route.last);
  const current = minutesOfDay(now);
  const result: number[] = [];
  for (let time = first; time <= last && result.length < count; time += route.intervalMin) {
    if (time >= current) result.push(time);
  }
  return result;
}
