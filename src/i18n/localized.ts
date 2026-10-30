import type { Language } from './translations';

/** Текст данных (сервисы, меню, расписание) сразу на трёх языках. */
export type LocalizedText = Record<Language, string>;

/** Короткая запись локализованного текста: lt('Привет', 'Сәлем', 'Hello'). */
export function lt(ru: string, kk: string, en: string): LocalizedText {
  return { ru, kk, en };
}
