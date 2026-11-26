export type ThemeMode = 'light' | 'dark';

/** Цвета в стиле Оксфорда: Oxford Blue, слоновая кость, камень и золото. */
export type ThemeColors = {
  background: string;
  /** Цвет свечения в верхней части экрана (градиент к background) */
  glow: string;
  surface: string;
  surfaceAlt: string;
  /** Полупрозрачные «стеклянные» поля и карточки */
  glass: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  /** Белая кнопка-пилюля и текст на ней */
  pill: string;
  onPill: string;
  /** Тёмная круглая кнопка со стрелкой */
  round: string;
  onRound: string;
  /** Градиент синих карточек */
  cardStart: string;
  cardEnd: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  tabBar: string;
  shadow: string;
};

export const palettes: Record<ThemeMode, ThemeColors> = {
  // Тёмная тема в стиле Оксфорда: глубокий тёмно-синий фон, золотые акценты, светлые кнопки цвета слоновой кости.
  dark: {
    background: '#001226',
    glow: '#1F3B5B',
    surface: '#0A2240',
    surfaceAlt: '#13304F',
    glass: 'rgba(248, 246, 239, 0.07)',
    border: 'rgba(201, 179, 126, 0.24)',
    text: '#F8F6EF',
    textSecondary: '#D9D3C4',
    textMuted: '#9BA6B5',
    primary: '#C9B37E',
    onPrimary: '#001A34',
    primarySoft: 'rgba(201, 179, 126, 0.18)',
    pill: '#F8F6EF',
    onPill: '#002147',
    round: '#C9B37E',
    onRound: '#001A34',
    cardStart: '#1F3B5B',
    cardEnd: '#001A34',
    danger: '#FF8A8A',
    dangerSoft: 'rgba(255, 138, 138, 0.16)',
    success: '#6FCF97',
    successSoft: 'rgba(111, 207, 151, 0.16)',
    warning: '#E8C66A',
    warningSoft: 'rgba(232, 198, 106, 0.14)',
    tabBar: '#000E1E',
    shadow: '#000000',
  },
  // Светлая тема в стиле Оксфорда: фон цвета слоновой кости, камень (stone), кнопки Oxford Blue #002147 и золото.
  light: {
    background: '#F8F6EF',
    glow: '#E5DFD1',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEADF',
    glass: 'rgba(255, 255, 255, 0.84)',
    border: 'rgba(0, 33, 71, 0.12)',
    text: '#0E1A2B',
    textSecondary: '#3E4A5C',
    textMuted: '#6E7787',
    primary: '#002147',
    onPrimary: '#FFFFFF',
    primarySoft: 'rgba(0, 33, 71, 0.08)',
    pill: '#FFFFFF',
    onPill: '#002147',
    round: '#002147',
    onRound: '#FFFFFF',
    cardStart: '#1F3B5B',
    cardEnd: '#001A34',
    danger: '#B3261E',
    dangerSoft: '#F8E4E1',
    success: '#2E7D4F',
    successSoft: '#E3F1E8',
    warning: '#8A6A1E',
    warningSoft: '#F5EDD6',
    tabBar: '#FFFDF8',
    shadow: '#001A34',
  },
};

/** Преобразует цвет вида #RRGGBB в rgba() с заданной прозрачностью. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
