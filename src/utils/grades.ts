import type { JournalEntry } from '../data/academic';

/**
 * Расчёт оценок по правилам, принятым в вузах Казахстана:
 *   рейтинг допуска = (РК1 + РК2) / 2
 *   итоговая оценка = рейтинг × 0,6 + экзамен × 0,4
 * Для допуска к экзамену рейтинг должен быть не ниже 50.
 */
export const ADMISSION_MIN = 50;

export function ratingOf(entry: JournalEntry): number {
  return Math.round((entry.rk1 + entry.rk2) / 2);
}

export function hasAdmission(entry: JournalEntry): boolean {
  return ratingOf(entry) >= ADMISSION_MIN;
}

/** Итог за предмет; null — экзамен ещё не сдавался. */
export function finalOf(entry: JournalEntry): number | null {
  if (entry.exam === null) return null;
  return Math.round(ratingOf(entry) * 0.6 + entry.exam * 0.4);
}

/** Буквенная оценка и балл GPA (шкала 4.0). */
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

/** Текущая оценка предмета: итог, а если экзамена ещё не было — рейтинг. */
export function currentScore(entry: JournalEntry): number {
  return finalOf(entry) ?? ratingOf(entry);
}

/** GPA, взвешенный по кредитам, по всем предметам. */
export function calculateGpa(entries: JournalEntry[]): number {
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = entries.reduce((sum, entry) => sum + letterGrade(currentScore(entry)).points * entry.credits, 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}

export function averageAttendance(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  return Math.round(entries.reduce((sum, entry) => sum + entry.attendance, 0) / entries.length);
}
