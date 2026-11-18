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
  // Светлая тема по примеру пользователя: светло-серый фон, белые «стеклянные» карточки,
  // чёрные кнопки-пилюли и чёрные акцентные карточки (монохромный стиль).
  light: {
    background: '#ECECEC',
    glow: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F3F3',
    glass: 'rgba(255, 255, 255, 0.78)',
    border: 'rgba(0, 0, 0, 0.08)',
    text: '#111111',
    textSecondary: '#4A4A4A',
    textMuted: '#808080',
    primary: '#111111',
    onPrimary: '#FFFFFF',
    primarySoft: 'rgba(0, 0, 0, 0.06)',
    pill: '#FFFFFF',
    onPill: '#111111',
    round: '#111111',
    onRound: '#FFFFFF',
    cardStart: '#2A2A2A',
    cardEnd: '#050505',
    danger: '#C62828',
    dangerSoft: '#FBE9E9',
    success: '#1E7D45',
    successSoft: '#E3F3E8',
    warning: '#9A5B00',
    warningSoft: '#FBF0DC',
    tabBar: '#FFFFFF',
    shadow: '#000000',
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
