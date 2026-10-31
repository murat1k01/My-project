import { LocalizedText, lt } from '../i18n/localized';

/**
 * ПРИМЕР данных из LMS. Важно подключить реальные курсы из Planonus ALT университета.
 * Оценки курсов берутся из журнала (src/data/academic.ts) по совпадающему id,
 * поэтому в Planonus ALT, журнале и профиле они всегда одинаковые.
 */
export type Course = {
  id: string;
  title: LocalizedText;
  teacher: string;
  /** Пройдено материалов, % */
  progress: number;
  color: string;
};

export type Assignment = {
  id: string;
  courseId: string;
  title: LocalizedText;
  /** Срок относительно сегодняшнего дня: 0 — сегодня, отрицательное — просрочено */
  dueInDays: number;
};

export const COURSES: Course[] = [
  { id: 'mobile', title: lt('Мобильные приложения', 'Мобильді қосымшалар', 'Mobile Applications'), teacher: 'Сейтжанов Б.М.', progress: 68, color: '#2F6BFF' },
  { id: 'db', title: lt('Базы данных', 'Деректер қоры', 'Databases'), teacher: 'Ким Е.В.', progress: 54, color: '#10B981' },
  { id: 'web', title: lt('Веб-разработка', 'Веб-әзірлеу', 'Web Development'), teacher: 'Жумабаев Е.Т.', progress: 75, color: '#F97316' },
  { id: 'algo', title: lt('Алгоритмы и структуры данных', 'Алгоритмдер және деректер құрылымы', 'Algorithms and Data Structures'), teacher: 'Оспанова Г.Р.', progress: 41, color: '#A855F7' },
  { id: 'english', title: lt('Английский язык', 'Ағылшын тілі', 'English'), teacher: 'Smith J.', progress: 80, color: '#EC4899' },
];

export const ASSIGNMENTS: Assignment[] = [
  { id: 'a1', courseId: 'mobile', title: lt('Лабораторная работа №3: навигация', '№3 зертханалық жұмыс: навигация', 'Lab 3: navigation'), dueInDays: 2 },
  { id: 'a2', courseId: 'db', title: lt('ER-диаграмма базы данных кампуса', 'Кампус дерекқорының ER-диаграммасы', 'Campus database ER diagram'), dueInDays: 5 },
  { id: 'a3', courseId: 'web', title: lt('Адаптивная вёрстка лендинга', 'Лендингтің бейімделгіш беттемесі', 'Responsive landing page'), dueInDays: 0 },
  { id: 'a4', courseId: 'algo', title: lt('Задачи на сортировку', 'Сұрыптау есептері', 'Sorting problems'), dueInDays: -1 },
  { id: 'a5', courseId: 'english', title: lt('Эссе: My future profession', 'Эссе: My future profession', 'Essay: My future profession'), dueInDays: 7 },
  { id: 'a6', courseId: 'mobile', title: lt('Тест по React Native', 'React Native бойынша тест', 'React Native quiz'), dueInDays: 10 },
];

