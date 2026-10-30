import { lt } from '../i18n/localized';
import type { Service, ServiceId } from '../types/Service';
import { images } from './images';

/** Единственный источник данных о восьми сервисах Campus Hub. */
export const SERVICES: Service[] = [
  {
    id: 'cal',
    code: 'CAL',
    title: lt('Расписание', 'Сабақ кестесі', 'Schedule'),
    description: lt('Пары, аудитории и преподаватели', 'Сабақтар, аудиториялар және оқытушылар', 'Classes, rooms and teachers'),
    icon: 'calendar-outline',
    accent: '#38BDF8',
    image: images.serviceCal,
  },
  {
    id: 'bus',
    code: 'BUS',
    title: lt('Автобусы', 'Автобустар', 'Buses'),
    description: lt('Маршруты, остановки и время', 'Бағыттар, аялдамалар және уақыт', 'Routes, stops and times'),
    icon: 'bus-outline',
    accent: '#34D399',
    image: images.serviceBus,
  },
  {
    id: 'lib',
    code: 'LIB',
    title: lt('Библиотека', 'Кітапхана', 'Library'),
    description: lt('Свободные места и онлайн-книги', 'Бос орындар және онлайн кітаптар', 'Free seats and online books'),
    icon: 'library-outline',
    accent: '#818CF8',
    image: images.serviceLib,
  },
  {
    id: 'lms',
    code: 'LMS',
    title: lt('Moodle', 'Moodle', 'Moodle'),
    description: lt('Курсы, задания и оценки', 'Курстар, тапсырмалар және бағалар', 'Courses, tasks and grades'),
    icon: 'school-outline',
    accent: '#FB923C',
    image: images.serviceLms,
  },
  {
    id: 'food',
    code: 'FOOD',
    title: lt('Столовая', 'Асхана', 'Canteen'),
    description: lt('Меню, цены и доставка', 'Мәзір, бағалар және жеткізу', 'Menu, prices and delivery'),
    icon: 'restaurant-outline',
    accent: '#FB7185',
    image: images.serviceFood,
  },
  {
    id: 'sport',
    code: 'SPORT',
    title: lt('Спорт', 'Спорт', 'Sport'),
    description: lt('Абонементы и тренировки', 'Абонементтер және жаттығулар', 'Memberships and training'),
    icon: 'barbell-outline',
    accent: '#FACC15',
    image: images.serviceSport,
  },
  {
    id: 'dorm',
    code: 'DORM',
    title: lt('Общежитие', 'Жатақхана', 'Dormitory'),
    description: lt('Прачечная, ремонт, пропуска', 'Кір жуу, жөндеу, рұқсатнамалар', 'Laundry, repairs, passes'),
    icon: 'bed-outline',
    accent: '#F472B6',
    image: images.serviceDorm,
  },
  {
    id: 'info',
    code: 'INFO',
    title: lt('Информация', 'Ақпарат', 'Info'),
    description: lt('Новости, контакты и вопросы', 'Жаңалықтар, байланыс және сұрақтар', 'News, contacts and FAQ'),
    icon: 'information-circle-outline',
    accent: '#A78BFA',
    image: images.serviceInfo,
  },
];

export function getServiceById(id: ServiceId): Service | undefined {
  return SERVICES.find((service) => service.id === id);
}

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === 'string' && SERVICES.some((service) => service.id === value);
}
