import { lt } from '../i18n/localized';
import type { Service, ServiceId } from '../types/Service';
import { images } from './images';

/** Разделы на главной. Библиотека, транспорт, информация и профиль находятся на нижней панели. */
export const SERVICES: Service[] = [
  {
    id: 'students',
    title: lt('Студенты', 'Студенттер', 'Students'),
    description: lt('Поиск студентов и контакты', 'Студенттерді іздеу және байланыс', 'Find students and contacts'),
    icon: 'people-outline',
    accent: '#60A5FA',
    image: images.serviceInfo,
    route: 'Students',
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
    id: 'journal',
    title: lt('Журнал', 'Журнал', 'Gradebook'),
    description: lt('Успеваемость за семестр', 'Семестрдегі үлгерім', 'Semester performance'),
    icon: 'ribbon-outline',
    accent: '#34D399',
    image: images.news3,
    route: 'Journal',
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
    id: 'planner',
    title: lt('Планировщик', 'Жоспарлағыш', 'Planner'),
    description: lt('Учебные задачи и проекты', 'Оқу тапсырмалары мен жобалар', 'Study tasks and projects'),
    icon: 'checkbox-outline',
    accent: '#A78BFA',
    image: images.serviceBus,
    route: 'Planner',
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
