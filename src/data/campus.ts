import { LocalizedText, lt } from '../i18n/localized';
import type { IoniconName } from '../types/Service';

export type CampusPlaceKind = 'main' | 'dorm' | 'shop';

export type CampusPlace = {
  id: string;
  kind: CampusPlaceKind;
  name: LocalizedText;
  address: string;
  lat: number;
  lon: number;
  /** Что известно о здании; только проверенные сведения */
  note: LocalizedText;
};

/**
 * Здания ALT University в Алматы. Координаты и адреса — из OpenStreetMap (© участники OpenStreetMap, лицензия ODbL),
 * проверено в ноябре 2026 года. Аудитории внутри зданий в открытых данных не размечены, поэтому здесь их нет.
 */
export const CAMPUS_PLACES: CampusPlace[] = [
  {
    id: 'main',
    kind: 'main',
    name: lt('Главный корпус ALT', 'ALT бас ғимараты', 'ALT main building'),
    address: 'ул. Шевченко, 97',
    lat: 43.245492,
    lon: 76.92935,
    note: lt('Учебный корпус университета, здесь же ALT Store', 'Университеттің оқу корпусы, мұнда ALT Store да бар', 'University teaching building, with ALT Store'),
  },
  {
    id: 'dorm4',
    kind: 'dorm',
    name: lt('Общежитие №4', '№4 студенттер үйі', 'Dormitory No. 4'),
    address: 'ул. Масанчи, 88',
    lat: 43.244059,
    lon: 76.930903,
    note: lt('Прачечная, контакт 6969, работает 06:00–23:00', 'Кір жуу бөлмесі, байланыс 6969, 06:00–23:00', 'Laundry, contact 6969, open 06:00–23:00'),
  },
  {
    id: 'dorm1',
    kind: 'dorm',
    name: lt('Общежитие №1', '№1 студенттер үйі', 'Dormitory No. 1'),
    address: 'ул. Мауленова, 108А',
    lat: 43.244889,
    lon: 76.936373,
    note: lt('Студенческий дом ALT', 'ALT студенттер үйі', 'ALT student house'),
  },
  {
    id: 'dorm2',
    kind: 'dorm',
    name: lt('Общежитие №2', '№2 студенттер үйі', 'Dormitory No. 2'),
    address: 'ул. Мауленова, 110',
    lat: 43.244411,
    lon: 76.936122,
    note: lt('Студенческий дом ALT', 'ALT студенттер үйі', 'ALT student house'),
  },
  {
    id: 'dorm3',
    kind: 'dorm',
    name: lt('Общежитие №3', '№3 студенттер үйі', 'Dormitory No. 3'),
    address: 'ул. Курмангазы, 88',
    lat: 43.243552,
    lon: 76.936346,
    note: lt('Студенческий дом ALT', 'ALT студенттер үйі', 'ALT student house'),
  },
];

export const PLACE_ICON: Record<CampusPlaceKind, IoniconName> = {
  main: 'school',
  dorm: 'bed',
  shop: 'storefront',
};

/** Расстояние между двумя точками в метрах (формула гаверсинусов) */
export function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h)));
}
