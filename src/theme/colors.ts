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
  // Светлый минимал (вариант B): светло-серый фон, белые карточки с мягкой тенью,
  // чёрный текст и синий акцент. Тексты проверены на контраст не ниже 4.5:1.
  light: {
    background: '#F5F6F8',
    glow: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F4',
    glass: '#FFFFFF',
    border: '#E6E8EC',
    text: '#0E1116',
    textSecondary: '#3D4350',
    textMuted: '#5B6270',
    primary: '#1F5CFF',
    onPrimary: '#FFFFFF',
    primarySoft: '#E8EEFF',
    pill: '#FFFFFF',
    onPill: '#0E1116',
    round: '#0E1116',
    onRound: '#FFFFFF',
    cardStart: '#1F5CFF',
    cardEnd: '#5B3DF5',
    danger: '#C62828',
    dangerSoft: '#FDE8E8',
    success: '#15803D',
    successSoft: '#E5F7EC',
    warning: '#A16207',
    warningSoft: '#FFF4DB',
    tabBar: '#FFFFFF',
    shadow: '#0E1116',
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
