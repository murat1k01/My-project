import { LocalizedText, lt } from '../i18n/localized';

/**
 * ПРИМЕР журнала успеваемости за семестр. Важно заменить реальными оценками
 * (например, выгрузкой из Platonus или Moodle вашего университета).
 */
export type JournalEntry = {
  /** Совпадает с id курса в LMS, чтобы оценки везде были одинаковыми */
  subjectId: string;
  subject: LocalizedText;
  teacher: string;
  credits: number;
  /** Рубежный контроль 1 и 2, 0–100 */
  rk1: number;
  rk2: number;
  /** Экзамен 0–100; null — ещё не сдавался */
  exam: number | null;
  /** Посещаемость, % */
  attendance: number;
  /** Оценки по неделям (15 недель семестра), 0–100 */
  weekly: number[];
};

export const JOURNAL: JournalEntry[] = [
  {
    subjectId: 'mobile',
    subject: lt('Мобильные приложения', 'Мобильді қосымшалар', 'Mobile Applications'),
    teacher: 'Сейтжанов Б.М.',
    credits: 5,
    rk1: 92,
    rk2: 88,
    exam: 94,
    attendance: 96,
    weekly: [90, 95, 88, 92, 100, 85, 90, 94, 88, 92, 96, 90, 86, 92, 95],
  },
  {
    subjectId: 'db',
    subject: lt('Базы данных', 'Деректер қоры', 'Databases'),
    teacher: 'Ким Е.В.',
    credits: 5,
    rk1: 84,
    rk2: 80,
    exam: 78,
    attendance: 90,
    weekly: [80, 85, 78, 82, 88, 76, 84, 80, 86, 79, 83, 81, 77, 85, 82],
  },
  {
    subjectId: 'web',
    subject: lt('Веб-разработка', 'Веб-әзірлеу', 'Web Development'),
    teacher: 'Жумабаев Е.Т.',
    credits: 4,
    rk1: 90,
    rk2: 86,
    exam: null,
    attendance: 92,
    weekly: [88, 92, 85, 90, 94, 87, 89, 91, 86, 90, 88, 92, 85, 89, 90],
  },
  {
    subjectId: 'algo',
    subject: lt('Алгоритмы и структуры данных', 'Алгоритмдер және деректер құрылымы', 'Algorithms and Data Structures'),
    teacher: 'Оспанова Г.Р.',
    credits: 5,
    rk1: 70,
    rk2: 76,
    exam: 72,
    attendance: 84,
    weekly: [65, 72, 70, 68, 75, 78, 70, 74, 69, 77, 73, 71, 76, 74, 72],
  },
  {
    subjectId: 'english',
    subject: lt('Английский язык', 'Ағылшын тілі', 'English'),
    teacher: 'Smith J.',
    credits: 3,
    rk1: 95,
    rk2: 97,
    exam: 96,
    attendance: 98,
    weekly: [95, 98, 96, 94, 100, 97, 95, 96, 98, 94, 97, 96, 99, 95, 97],
  },
  {
    subjectId: 'math',
    subject: lt('Математический анализ', 'Математикалық талдау', 'Calculus'),
    teacher: 'Ахметова А.К.',
    credits: 5,
    rk1: 45,
    rk2: 52,
    exam: null,
    attendance: 71,
    weekly: [50, 40, 55, 48, 52, 38, 45, 60, 42, 50, 55, 47, 53, 49, 51],
  },
  {
    subjectId: 'networks',
    subject: lt('Компьютерные сети', 'Компьютерлік желілер', 'Computer Networks'),
    teacher: 'Ибраев К.А.',
    credits: 4,
    rk1: 78,
    rk2: 82,
    exam: null,
    attendance: 88,
    weekly: [75, 80, 78, 82, 79, 84, 77, 81, 83, 78, 80, 82, 79, 84, 81],
  },
  {
    subjectId: 'history',
    subject: lt('История Казахстана', 'Қазақстан тарихы', 'History of Kazakhstan'),
    teacher: 'Нурланова Д.С.',
    credits: 3,
    rk1: 88,
    rk2: 90,
    exam: 92,
    attendance: 94,
    weekly: [85, 90, 88, 92, 86, 89, 91, 87, 90, 93, 88, 90, 92, 89, 91],
  },
];

export function getJournalEntry(subjectId: string): JournalEntry | undefined {
  return JOURNAL.find((entry) => entry.subjectId === subjectId);
}
