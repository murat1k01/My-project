import { LocalizedText, lt } from '../i18n/localized';
import { minutesOfDay, toMinutes } from '../utils/format';

/**
 * ПРИМЕР расписания группы. Важно заменить реальным расписанием университета.
 */
export type LessonType = 'lecture' | 'practice' | 'lab';

export type Lesson = {
  id: string;
  start: string;
  end: string;
  subject: LocalizedText;
  teacher: string;
  room: string;
  type: LessonType;
};

const SUBJECTS = {
  math: lt('Математический анализ', 'Математикалық талдау', 'Calculus'),
  mobile: lt('Мобильные приложения', 'Мобильді қосымшалар', 'Mobile Applications'),
  db: lt('Базы данных', 'Деректер қоры', 'Databases'),
  web: lt('Веб-разработка', 'Веб-әзірлеу', 'Web Development'),
  english: lt('Английский язык', 'Ағылшын тілі', 'English'),
  history: lt('История Казахстана', 'Қазақстан тарихы', 'History of Kazakhstan'),
  algo: lt('Алгоритмы и структуры данных', 'Алгоритмдер және деректер құрылымы', 'Algorithms and Data Structures'),
  networks: lt('Компьютерные сети', 'Компьютерлік желілер', 'Computer Networks'),
  pe: lt('Физическая культура', 'Дене шынықтыру', 'Physical Education'),
};

const SLOTS = [
  ['08:30', '09:50'],
  ['10:00', '11:20'],
  ['11:30', '12:50'],
  ['13:30', '14:50'],
  ['15:00', '16:20'],
] as const;

function lesson(
  day: number,
  slot: number,
  subject: keyof typeof SUBJECTS,
  type: LessonType,
  room: string,
  teacher: string,
): Lesson {
  const [start, end] = SLOTS[slot];
  return { id: `${day}-${slot}`, start, end, subject: SUBJECTS[subject], type, room, teacher };
}

/** Ключ — номер дня недели как у Date.getDay(): 1 = понедельник … 6 = суббота. */
export const SCHEDULE: Record<number, Lesson[]> = {
  1: [
    lesson(1, 0, 'math', 'lecture', 'A-201', 'Ахметова А.К.'),
    lesson(1, 1, 'mobile', 'lecture', 'B-305', 'Сейтжанов Б.М.'),
    lesson(1, 2, 'mobile', 'lab', 'C-112', 'Сейтжанов Б.М.'),
  ],
  2: [
    lesson(2, 0, 'db', 'lecture', 'A-104', 'Ким Е.В.'),
    lesson(2, 1, 'english', 'practice', 'D-210', 'Smith J.'),
    lesson(2, 3, 'history', 'lecture', 'A-301', 'Нурланова Д.С.'),
  ],
  3: [
    lesson(3, 1, 'web', 'lecture', 'B-305', 'Жумабаев Е.Т.'),
    lesson(3, 2, 'web', 'lab', 'C-114', 'Жумабаев Е.Т.'),
    lesson(3, 3, 'math', 'practice', 'A-203', 'Ахметова А.К.'),
    lesson(3, 4, 'pe', 'practice', 'Спортзал', 'Касымов Е.Б.'),
  ],
  4: [
    lesson(4, 0, 'algo', 'lecture', 'A-104', 'Оспанова Г.Р.'),
    lesson(4, 1, 'db', 'lab', 'C-112', 'Ким Е.В.'),
    lesson(4, 2, 'english', 'practice', 'D-210', 'Smith J.'),
  ],
  5: [
    lesson(5, 0, 'networks', 'lecture', 'B-201', 'Ибраев К.А.'),
    lesson(5, 1, 'algo', 'practice', 'C-114', 'Оспанова Г.Р.'),
    lesson(5, 3, 'mobile', 'practice', 'C-112', 'Сейтжанов Б.М.'),
  ],
  6: [
    lesson(6, 1, 'networks', 'lab', 'C-118', 'Ибраев К.А.'),
    lesson(6, 2, 'pe', 'practice', 'Спортзал', 'Касымов Е.Б.'),
  ],
};

/** Дни, которые показываются в переключателе (Пн–Сб). */
export const STUDY_DAYS = [1, 2, 3, 4, 5, 6];

export function getLessons(weekday: number): Lesson[] {
  return SCHEDULE[weekday] ?? [];
}

/** Текущая или ближайшая пара сегодня. */
export function findCurrentOrNextLesson(now: Date): { lesson: Lesson; status: 'now' | 'next' } | null {
  const minutes = minutesOfDay(now);
  for (const item of getLessons(now.getDay())) {
    if (minutes >= toMinutes(item.start) && minutes < toMinutes(item.end)) return { lesson: item, status: 'now' };
    if (minutes < toMinutes(item.start)) return { lesson: item, status: 'next' };
  }
  return null;
}
