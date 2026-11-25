export type ThemeMode = 'light' | 'dark';

/** Цвета в стиле Гарварда: малиновый (crimson) акцент, слоновая кость, тёмный текст. */
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
  // Тёмная тема в стиле Гарварда: тёмный «бордовый» фон, малиновое свечение, светлые кнопки цвета слоновой кости.
  dark: {
    background: '#140A0C',
    glow: '#5A1220',
    surface: '#22131A',
    surfaceAlt: '#2E1A20',
    glass: 'rgba(255, 245, 235, 0.07)',
    border: 'rgba(255, 240, 230, 0.13)',
    text: '#FBF7F0',
    textSecondary: '#DCCFC6',
    textMuted: '#A3918A',
    primary: '#D23A50',
    onPrimary: '#FFFFFF',
    primarySoft: 'rgba(210, 58, 80, 0.20)',
    pill: '#F6F1E7',
    onPill: '#5E0F1C',
    round: '#2A0D14',
    onRound: '#FBF7F0',
    cardStart: '#A51C30',
    cardEnd: '#4A0B16',
    danger: '#FF8A8A',
    dangerSoft: 'rgba(255, 138, 138, 0.16)',
    success: '#6FCF97',
    successSoft: 'rgba(111, 207, 151, 0.16)',
    warning: '#E8B95A',
    warningSoft: 'rgba(232, 185, 90, 0.14)',
    tabBar: '#100709',
    shadow: '#000000',
  },
  // Светлая тема в стиле Гарварда: фон цвета слоновой кости, малиновый (Harvard Crimson #A51C30) акцент,
  // тёмный текст и белые карточки.
  light: {
    background: '#F6F1E7',
    glow: '#EADCCB',
    surface: '#FFFFFF',
    surfaceAlt: '#EFE7DA',
    glass: 'rgba(255, 255, 255, 0.82)',
    border: 'rgba(60, 30, 20, 0.12)',
    text: '#1E1E1E',
    textSecondary: '#4A433D',
    textMuted: '#857A70',
    primary: '#A51C30',
    onPrimary: '#FFFFFF',
    primarySoft: 'rgba(165, 28, 48, 0.10)',
    pill: '#FFFFFF',
    onPill: '#A51C30',
    round: '#A51C30',
    onRound: '#FFFFFF',
    cardStart: '#A51C30',
    cardEnd: '#5E0F1C',
    danger: '#B3261E',
    dangerSoft: '#F8E4E1',
    success: '#2E7D4F',
    successSoft: '#E3F1E8',
    warning: '#8A5A00',
    warningSoft: '#F6EBD3',
    tabBar: '#FFFDF8',
    shadow: '#3C1E14',
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
