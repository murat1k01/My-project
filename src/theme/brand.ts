/** Фирменные элементы ALTushki в стиле Oxford Academic Heritage. */

/** Слоган приложения: одинаковый на всех языках интерфейса */
export const SLOGAN = 'Білім. Мүмкіндік. Болашақ.';

/** Цвета, которые не меняются вместе с темой: поверх фотографий и на «обложках» */
export const brand = {
  /** Oxford Blue */
  navy: '#002147',
  /** Deep Academic Navy */
  deepNavy: '#0C2035',
  /** Midnight Blue */
  midnight: '#071626',
  /** Champagne Gold: линии и надписи поверх тёмных фото */
  gold: '#D4B77C',
  /** Antique Gold */
  antiqueGold: '#B68B40',
  burgundy: '#702A32',
  ivory: '#F8F3E8',
  /** Затемнение фото: от прозрачного к Oxford Blue */
  photoShade: ['rgba(0, 33, 71, 0.05)', 'rgba(0, 33, 71, 0.55)', 'rgba(7, 22, 38, 0.92)'] as const,
};
