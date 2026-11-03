import { lt } from '../i18n/localized';
import type { Service, ServiceId } from '../types/Service';
import { images } from './images';

/** Разделы на главной. Журнал, студенты, профиль и настройки находятся на нижней панели. */
export const SERVICES: Service[] = [
  {
    id: 'library',
    title: lt('Библиотека', 'Кітапхана', 'Library'),
    description: lt('Каталог, обложки и избранное', 'Каталог, мұқабалар және таңдаулы', 'Catalog, covers and favorites'),
    icon: 'library-outline',
    accent: '#818CF8',
    image: images.serviceLib,
    route: 'Library',
  },
  {
    id: 'transport',
    title: lt('Транспорт', 'Көлік', 'Transport'),
    description: lt('Автобусы и остановки Алматы', 'Алматы автобустары мен аялдамалары', 'Almaty buses and stops'),
    icon: 'bus-outline',
    accent: '#34D399',
    image: images.serviceBus,
    route: 'Transport',
  },
  {
    id: 'food',
    title: lt('Столовая', 'Асхана', 'Canteen'),
    description: lt('Меню, цены и заказ', 'Мәзір, бағалар және тапсырыс', 'Menu, prices and orders'),
    icon: 'restaurant-outline',
    accent: '#FB7185',
    image: images.serviceFood,
  },
  {
    id: 'dorm',
    title: lt('Общежитие', 'Жатақхана', 'Dormitory'),
    description: lt('Стирка, ремонт, сведения', 'Кір жуу, жөндеу, мәліметтер', 'Laundry, repairs, details'),
    icon: 'bed-outline',
    accent: '#F472B6',
    image: images.serviceDorm,
  },
  {
    id: 'info',
    title: lt('Информация', 'Ақпарат', 'Information'),
    description: lt('Справка, контакты и вопросы', 'Анықтама, байланыс және сұрақтар', 'Reference, contacts and FAQ'),
    icon: 'information-circle-outline',
    accent: '#A78BFA',
    image: images.serviceInfo,
    route: 'Info',
  },
  {
    id: 'subscription',
    title: lt('Подписка', 'Жазылым', 'Subscription'),
    description: lt('Тарифы и возможности', 'Тарифтер мен мүмкіндіктер', 'Plans and features'),
    icon: 'sparkles-outline',
    accent: '#FBBF24',
    image: images.news2,
    route: 'Subscription',
  },
  {
    id: 'cal',
    title: lt('Расписание', 'Сабақ кестесі', 'Schedule'),
    description: lt('Пары и аудитории', 'Сабақтар мен аудиториялар', 'Classes and rooms'),
    icon: 'calendar-outline',
    accent: '#38BDF8',
    image: images.serviceCal,
    hidden: true,
  },
  {
    id: 'lms',
    title: lt('Planonus ALT', 'Planonus ALT', 'Planonus ALT'),
    description: lt('Курсы, задания и оценки', 'Курстар, тапсырмалар және бағалар', 'Courses, tasks and grades'),
    icon: 'school-outline',
    accent: '#FB923C',
    image: images.serviceLms,
  },
  {
    id: 'sport',
    title: lt('Спорт', 'Спорт', 'Sport'),
    description: lt('Секции и тренировки', 'Секциялар және жаттығулар', 'Sections and training'),
    icon: 'barbell-outline',
    accent: '#FACC15',
    image: images.serviceSport,
  },
  {
    id: 'lib',
    title: lt('Читальный зал', 'Оқу залы', 'Reading room'),
    description: lt('Места и план этажей', 'Орындар және қабат жоспары', 'Seats and floor plan'),
    icon: 'library-outline',
    accent: '#818CF8',
    image: images.serviceLib,
    hidden: true,
  },
];

export function getServiceById(id: ServiceId): Service | undefined {
  return SERVICES.find((service) => service.id === id);
}

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === 'string' && SERVICES.some((service) => service.id === value);
}
