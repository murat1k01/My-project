export type ThemeMode = 'light' | 'dark';

/** Цвета в стиле «глубокий синий космос»: тёмно-синий фон, синее свечение, белые кнопки-пилюли. */
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
  dark: {
    background: '#04060F',
    glow: '#123A9C',
    surface: '#0D1430',
    surfaceAlt: '#16204A',
    glass: 'rgba(255, 255, 255, 0.07)',
    border: 'rgba(255, 255, 255, 0.12)',
    text: '#FFFFFF',
    textSecondary: '#C3CCE6',
    textMuted: '#8792B4',
    primary: '#2F6BFF',
    onPrimary: '#FFFFFF',
    primarySoft: 'rgba(47, 107, 255, 0.20)',
    pill: '#FFFFFF',
    onPill: '#0A0F24',
    round: '#0A0F24',
    onRound: '#FFFFFF',
    cardStart: '#3A6DF0',
    cardEnd: '#0E2160',
    danger: '#FF7A7A',
    dangerSoft: 'rgba(255, 122, 122, 0.16)',
    success: '#4ADE80',
    successSoft: 'rgba(74, 222, 128, 0.16)',
    warning: '#FBBF24',
    warningSoft: 'rgba(251, 191, 36, 0.14)',
    tabBar: '#070B1C',
    shadow: '#000000',
  },
  light: {
    background: '#EEF2FB',
    glow: '#C4D5FF',
    surface: '#FFFFFF',
    surfaceAlt: '#E3EAFA',
    glass: 'rgba(255, 255, 255, 0.85)',
    border: '#D5DDF0',
    text: '#0A0F24',
    textSecondary: '#3F4B6B',
    textMuted: '#6A7593',
    primary: '#1F5BFF',
    onPrimary: '#FFFFFF',
    primarySoft: '#DCE6FF',
    pill: '#FFFFFF',
    onPill: '#0A0F24',
    round: '#0A0F24',
    onRound: '#FFFFFF',
    cardStart: '#4A7BF7',
    cardEnd: '#183488',
    danger: '#DC2626',
    dangerSoft: '#FDE8E8',
    success: '#15803D',
    successSoft: '#DCFCE7',
    warning: '#B45309',
    warningSoft: '#FEF3C7',
    tabBar: '#FFFFFF',
    shadow: '#0A1A4A',
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
