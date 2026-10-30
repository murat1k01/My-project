import { LocalizedText, lt } from '../i18n/localized';

/**
 * ПРИМЕР данных из LMS. Важно подключить реальные курсы и оценки из Moodle университета.
 */
export type Course = {
  id: string;
  title: LocalizedText;
  teacher: string;
  /** Пройдено материалов, % */
  progress: number;
  /** Текущий балл 0–100 */
  score: number;
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
  { id: 'mobile', title: lt('Мобильные приложения', 'Мобильді қосымшалар', 'Mobile Applications'), teacher: 'Сейтжанов Б.М.', progress: 68, score: 92, color: '#2F6BFF' },
  { id: 'db', title: lt('Базы данных', 'Деректер қоры', 'Databases'), teacher: 'Ким Е.В.', progress: 54, score: 84, color: '#10B981' },
  { id: 'web', title: lt('Веб-разработка', 'Веб-әзірлеу', 'Web Development'), teacher: 'Жумабаев Е.Т.', progress: 75, score: 88, color: '#F97316' },
  { id: 'algo', title: lt('Алгоритмы и структуры данных', 'Алгоритмдер және деректер құрылымы', 'Algorithms and Data Structures'), teacher: 'Оспанова Г.Р.', progress: 41, score: 76, color: '#A855F7' },
  { id: 'english', title: lt('Английский язык', 'Ағылшын тілі', 'English'), teacher: 'Smith J.', progress: 80, score: 95, color: '#EC4899' },
];

export const ASSIGNMENTS: Assignment[] = [
  { id: 'a1', courseId: 'mobile', title: lt('Лабораторная работа №3: навигация', '№3 зертханалық жұмыс: навигация', 'Lab 3: navigation'), dueInDays: 2 },
  { id: 'a2', courseId: 'db', title: lt('ER-диаграмма базы данных кампуса', 'Кампус дерекқорының ER-диаграммасы', 'Campus database ER diagram'), dueInDays: 5 },
  { id: 'a3', courseId: 'web', title: lt('Адаптивная вёрстка лендинга', 'Лендингтің бейімделгіш беттемесі', 'Responsive landing page'), dueInDays: 0 },
  { id: 'a4', courseId: 'algo', title: lt('Задачи на сортировку', 'Сұрыптау есептері', 'Sorting problems'), dueInDays: -1 },
  { id: 'a5', courseId: 'english', title: lt('Эссе: My future profession', 'Эссе: My future profession', 'Essay: My future profession'), dueInDays: 7 },
  { id: 'a6', courseId: 'mobile', title: lt('Тест по React Native', 'React Native бойынша тест', 'React Native quiz'), dueInDays: 10 },
];

/** Буквенная оценка и GPA-балл по шкале, принятой в вузах Казахстана. */
export function letterGrade(score: number): { letter: string; points: number } {
  if (score >= 95) return { letter: 'A', points: 4.0 };
  if (score >= 90) return { letter: 'A-', points: 3.67 };
  if (score >= 85) return { letter: 'B+', points: 3.33 };
  if (score >= 80) return { letter: 'B', points: 3.0 };
  if (score >= 75) return { letter: 'B-', points: 2.67 };
  if (score >= 70) return { letter: 'C+', points: 2.33 };
  if (score >= 65) return { letter: 'C', points: 2.0 };
  if (score >= 60) return { letter: 'C-', points: 1.67 };
  if (score >= 55) return { letter: 'D+', points: 1.33 };
  if (score >= 50) return { letter: 'D', points: 1.0 };
  return { letter: 'F', points: 0 };
}

export function calculateGpa(courses: Course[]): number {
  if (courses.length === 0) return 0;
  const total = courses.reduce((sum, course) => sum + letterGrade(course.score).points, 0);
  return Math.round((total / courses.length) * 100) / 100;
}

/** Официальный сайт Moodle. Важно заменить адресом Moodle вашего университета. */
export const MOODLE_URL = 'https://moodle.org';
