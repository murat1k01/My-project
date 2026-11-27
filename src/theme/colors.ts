export type ThemeMode = 'light' | 'dark';

/** Дизайн-система Oxford Academic Premium: Oxford Navy, Royal Gold, Ivory Cream, Midnight, Academic Green, Burgundy. */
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
  /** Royal Gold: декоративные линии, активные элементы, достижения */
  gold: string;
};

export const palettes: Record<ThemeMode, ThemeColors> = {
  // Oxford Midnight: глубокий тёмно-синий фон, золотые акценты, тёплый белый текст.
  dark: {
    background: '#0B1828',
    glow: '#1A3557',
    surface: '#12233A',
    surfaceAlt: '#18212C',
    glass: 'rgba(245, 240, 230, 0.07)',
    border: 'rgba(197, 164, 109, 0.24)',
    text: '#F5F0E6',
    textSecondary: '#D8CFBF',
    textMuted: '#9AA3AF',
    primary: '#C5A46D',
    onPrimary: '#0C233F',
    primarySoft: 'rgba(197, 164, 109, 0.18)',
    pill: '#F5F0E6',
    onPill: '#0C233F',
    round: '#C5A46D',
    onRound: '#0C233F',
    cardStart: '#1A3557',
    cardEnd: '#0C233F',
    danger: '#E08A92',
    dangerSoft: 'rgba(224, 138, 146, 0.16)',
    success: '#7FB58F',
    successSoft: 'rgba(127, 181, 143, 0.16)',
    warning: '#E3C27E',
    warningSoft: 'rgba(227, 194, 126, 0.14)',
    tabBar: '#081322',
    shadow: '#000000',
    gold: '#C5A46D',
  },
  // Oxford Classic: фон Ivory Cream, белые карточки, кнопки Oxford Navy, золотые акценты.
  light: {
    background: '#F5F0E6',
    glow: '#E5D9C5',
    surface: '#FFFFFF',
    surfaceAlt: '#EDE5D6',
    glass: 'rgba(255, 255, 255, 0.86)',
    border: 'rgba(12, 35, 63, 0.12)',
    text: '#18212C',
    textSecondary: '#4B4740',
    textMuted: '#776F63',
    primary: '#0C233F',
    onPrimary: '#FFFFFF',
    primarySoft: 'rgba(12, 35, 63, 0.08)',
    pill: '#FFFFFF',
    onPill: '#0C233F',
    round: '#0C233F',
    onRound: '#FFFFFF',
    cardStart: '#1A3557',
    cardEnd: '#0C233F',
    danger: '#722F37',
    dangerSoft: '#F3E3E3',
    success: '#426B50',
    successSoft: '#E2ECE4',
    warning: '#8A6A2E',
    warningSoft: '#F3EAD7',
    tabBar: '#FFFCF6',
    shadow: '#0C233F',
    gold: '#C5A46D',
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
