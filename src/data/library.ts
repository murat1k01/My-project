import { LocalizedText, lt } from '../i18n/localized';
import { dayKey, hashString } from '../utils/format';

/**
 * Читальный зал: 5 рядов по 6 мест.
 * Реального датчика занятости нет, поэтому занятость — ПРИМЕР: она стабильно
 * вычисляется из номера места, дня и часа (меняется каждый час).
 */
export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E'];
export const SEATS_PER_ROW = 6;

export function isSeatBusy(seatId: string, now: Date): boolean {
  const seed = `${seatId}|${dayKey(now)}|${now.getHours()}`;
  return hashString(seed) % 100 < 45;
}

export type OnlineBook = {
  id: string;
  title: LocalizedText;
  author: LocalizedText;
  year: number;
  pages: number;
  /** Ссылка на книгу в Project Gutenberg (книги в общественном достоянии) */
  url: string;
  colors: [string, string];
};

export const ONLINE_BOOKS: OnlineBook[] = [
  {
    id: 'war-and-peace',
    title: lt('Война и мир', 'Соғыс және бейбітшілік', 'War and Peace'),
    author: lt('Лев Толстой', 'Лев Толстой', 'Leo Tolstoy'),
    year: 1869,
    pages: 1225,
    url: 'https://www.gutenberg.org/ebooks/2600',
    colors: ['#1E3A8A', '#3B82F6'],
  },
  {
    id: 'crime-and-punishment',
    title: lt('Преступление и наказание', 'Қылмыс пен жаза', 'Crime and Punishment'),
    author: lt('Фёдор Достоевский', 'Фёдор Достоевский', 'Fyodor Dostoevsky'),
    year: 1866,
    pages: 551,
    url: 'https://www.gutenberg.org/ebooks/2554',
    colors: ['#7F1D1D', '#EF4444'],
  },
  {
    id: 'pride-and-prejudice',
    title: lt('Гордость и предубеждение', 'Тәкаппарлық пен алалау', 'Pride and Prejudice'),
    author: lt('Джейн Остин', 'Джейн Остин', 'Jane Austen'),
    year: 1813,
    pages: 432,
    url: 'https://www.gutenberg.org/ebooks/1342',
    colors: ['#831843', '#EC4899'],
  },
  {
    id: 'alice',
    title: lt('Алиса в Стране чудес', 'Алиса ғажайыптар елінде', "Alice's Adventures in Wonderland"),
    author: lt('Льюис Кэрролл', 'Льюис Кэрролл', 'Lewis Carroll'),
    year: 1865,
    pages: 96,
    url: 'https://www.gutenberg.org/ebooks/11',
    colors: ['#065F46', '#10B981'],
  },
  {
    id: 'sherlock',
    title: lt('Приключения Шерлока Холмса', 'Шерлок Холмстің шытырман оқиғалары', 'The Adventures of Sherlock Holmes'),
    author: lt('Артур Конан Дойл', 'Артур Конан Дойл', 'Arthur Conan Doyle'),
    year: 1892,
    pages: 307,
    url: 'https://www.gutenberg.org/ebooks/1661',
    colors: ['#78350F', '#F59E0B'],
  },
  {
    id: 'frankenstein',
    title: lt('Франкенштейн', 'Франкенштейн', 'Frankenstein'),
    author: lt('Мэри Шелли', 'Мэри Шелли', 'Mary Shelley'),
    year: 1818,
    pages: 280,
    url: 'https://www.gutenberg.org/ebooks/84',
    colors: ['#312E81', '#8B5CF6'],
  },
];
