import { LocalizedText, lt } from '../i18n/localized';
import { minutesOfDay, toMinutes } from '../utils/format';

/**
 * ПРИМЕР маршрутов по Алматы до кампуса ALT (ул. Байтурсынова).
 * Координаты остановок примерные, количество автобусов и расписание — демонстрационные.
 * Реальных GPS-данных о положении автобусов в приложении нет: позиции рассчитываются по расписанию.
 */
export type Coordinate = { latitude: number; longitude: number };

export type BusStop = {
  name: LocalizedText;
  coordinate: Coordinate;
};

export type BusRoute = {
  id: string;
  number: string;
  color: string;
  name: LocalizedText;
  stops: BusStop[];
  /** Сколько автобусов работает на маршруте */
  buses: number;
  /** Интервал движения в минутах */
  intervalMin: number;
  first: string;
  last: string;
  /** Время в пути от первой до последней остановки */
  travelMin: number;
  fare: number;
};

const CAMPUS: BusStop = {
  name: lt('Кампус ALT (ул. Байтурсынова)', 'ALT кампусы (Байтұрсынұлы к.)', 'ALT Campus (Baitursynov St.)'),
  coordinate: { latitude: 43.2349, longitude: 76.9255 },
};
const ABAY_BAITURSYNOV: BusStop = {
  name: lt('пр. Абая / ул. Байтурсынова', 'Абай д. / Байтұрсынұлы к.', 'Abay Ave / Baitursynov St.'),
  coordinate: { latitude: 43.2405, longitude: 76.9268 },
};

export const BUS_ROUTES: BusRoute[] = [
  {
    id: 'r12',
    number: '12',
    color: '#2F6BFF',
    name: lt('Самал-2 — Кампус', 'Самал-2 — Кампус', 'Samal-2 — Campus'),
    stops: [
      { name: lt('Мкр. Самал-2', 'Самал-2 ш/а', 'Samal-2 district'), coordinate: { latitude: 43.2283, longitude: 76.9547 } },
      { name: lt('пр. Достык / пр. Абая', 'Достық д. / Абай д.', 'Dostyk Ave / Abay Ave'), coordinate: { latitude: 43.2408, longitude: 76.9575 } },
      { name: lt('Площадь Республики', 'Республика алаңы', 'Republic Square'), coordinate: { latitude: 43.2381, longitude: 76.9452 } },
      ABAY_BAITURSYNOV,
      CAMPUS,
    ],
    buses: 8,
    intervalMin: 10,
    first: '06:30',
    last: '22:30',
    travelMin: 30,
    fare: 200,
  },
  {
    id: 'r37',
    number: '37',
    color: '#F97316',
    name: lt('Аэропорт — Кампус', 'Әуежай — Кампус', 'Airport — Campus'),
    stops: [
      { name: lt('Аэропорт Алматы', 'Алматы әуежайы', 'Almaty Airport'), coordinate: { latitude: 43.3524, longitude: 77.04 } },
      { name: lt('пр. Суюнбая', 'Сүйінбай д.', 'Suyunbay Ave'), coordinate: { latitude: 43.3, longitude: 76.97 } },
      { name: lt('Зелёный базар', 'Көк базар', 'Green Bazaar'), coordinate: { latitude: 43.2636, longitude: 76.9536 } },
      { name: lt('ул. Толе би / ул. Байтурсынова', 'Төле би к. / Байтұрсынұлы к.', 'Tole Bi St / Baitursynov St'), coordinate: { latitude: 43.2509, longitude: 76.928 } },
      CAMPUS,
    ],
    buses: 6,
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
      { name: lt('Общежитие №1', '№1 жатақхана', 'Dormitory #1'), coordinate: { latitude: 43.2236, longitude: 76.9118 } },
      { name: lt('Общежитие №2', '№2 жатақхана', 'Dormitory #2'), coordinate: { latitude: 43.2262, longitude: 76.9165 } },
      { name: lt('Спорткомплекс', 'Спорт кешені', 'Sports complex'), coordinate: { latitude: 43.2304, longitude: 76.9212 } },
      CAMPUS,
    ],
    buses: 4,
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
    name: lt('Сайран — Кампус', 'Сайран — Кампус', 'Sayran — Campus'),
    stops: [
      { name: lt('Мкр. Жетысу-2', 'Жетісу-2 ш/а', 'Zhetysu-2 district'), coordinate: { latitude: 43.234, longitude: 76.864 } },
      { name: lt('Автовокзал «Сайран»', '«Сайран» автовокзалы', 'Sayran bus terminal'), coordinate: { latitude: 43.2383, longitude: 76.87 } },
      { name: lt('пр. Абая / ул. Розыбакиева', 'Абай д. / Розыбакиев к.', 'Abay Ave / Rozybakiev St'), coordinate: { latitude: 43.24, longitude: 76.899 } },
      ABAY_BAITURSYNOV,
      CAMPUS,
    ],
    buses: 5,
    intervalMin: 15,
    first: '06:45',
    last: '21:30',
    travelMin: 35,
    fare: 200,
  },
];

/** Центр и масштаб карты, при которых видны все маршруты. */
export const ALMATY_REGION = { latitude: 43.275, longitude: 76.95, latitudeDelta: 0.17, longitudeDelta: 0.17 };

export const TOTAL_BUSES = BUS_ROUTES.reduce((sum, route) => sum + route.buses, 0);

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

export function isRouteRunning(route: BusRoute, now: Date): boolean {
  const current = minutesOfDay(now);
  return current >= toMinutes(route.first) && current <= toMinutes(route.last) + route.travelMin;
}

/** Точка на ломаной линии маршрута: fraction 0 — первая остановка, 1 — последняя. */
function pointAlong(stops: BusStop[], fraction: number): Coordinate {
  const points = stops.map((stop) => stop.coordinate);
  const segments = points.slice(1).map((point, i) => Math.hypot(point.latitude - points[i].latitude, point.longitude - points[i].longitude));
  const total = segments.reduce((sum, length) => sum + length, 0);
  let distance = Math.max(0, Math.min(1, fraction)) * total;
  for (let i = 0; i < segments.length; i += 1) {
    if (distance <= segments[i] || i === segments.length - 1) {
      const k = segments[i] === 0 ? 0 : Math.min(1, distance / segments[i]);
      return {
        latitude: points[i].latitude + (points[i + 1].latitude - points[i].latitude) * k,
        longitude: points[i].longitude + (points[i + 1].longitude - points[i].longitude) * k,
      };
    }
    distance -= segments[i];
  }
  return points[points.length - 1];
}

export type BusPosition = { id: string; routeId: string; coordinate: Coordinate };

/**
 * ДЕМО-позиции автобусов: каждый автобус едет туда и обратно по маршруту,
 * автобусы равномерно разнесены по кругу. Это расчёт по расписанию, а не GPS.
 */
export function getBusPositions(route: BusRoute, now: Date): BusPosition[] {
  if (!isRouteRunning(route, now)) return [];
  const minutes = minutesOfDay(now) + now.getSeconds() / 60;
  const cycle = route.travelMin * 2;
  return Array.from({ length: route.buses }, (_, index) => {
    const phase = (((minutes + (index * cycle) / route.buses) % cycle) + cycle) % cycle / cycle;
    const fraction = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    return { id: `${route.id}-${index}`, routeId: route.id, coordinate: pointAlong(route.stops, fraction) };
  });
}
