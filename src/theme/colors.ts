export type ThemeMode = 'light' | 'dark';

/** Дизайн-система Oxford Academic Heritage: Oxford Blue, Academic Navy, Midnight, Ivory, Cream, Parchment, Antique Gold, Champagne, Burgundy. */
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
  // Oxford Dark: глубокий Midnight Blue, матовые синие карточки, кремовый текст, золотые акценты.
  dark: {
    background: '#071626',
    glow: '#0C2035',
    surface: '#0C2035',
    surfaceAlt: '#12294A',
    glass: 'rgba(248, 243, 232, 0.06)',
    border: 'rgba(212, 183, 124, 0.22)',
    text: '#F8F3E8',
    textSecondary: '#D9CFBE',
    textMuted: '#9EA4AC',
    primary: '#D4B77C',
    onPrimary: '#071626',
    primarySoft: 'rgba(212, 183, 124, 0.16)',
    pill: '#F8F3E8',
    onPill: '#002147',
    round: '#D4B77C',
    onRound: '#071626',
    cardStart: '#0C2035',
    cardEnd: '#071626',
    danger: '#E08583',
    dangerSoft: 'rgba(224, 133, 131, 0.16)',
    success: '#7DB98B',
    successSoft: 'rgba(125, 185, 139, 0.16)',
    warning: '#E0C07E',
    warningSoft: 'rgba(224, 192, 126, 0.14)',
    tabBar: '#050F1C',
    shadow: '#000000',
    gold: '#D4B77C',
  },
  // Oxford Light: Academic Ivory, белые карточки, кнопки Oxford Blue, Antique Gold, тонкие границы.
  light: {
    background: '#F8F3E8',
    glow: '#EDE3D2',
    surface: '#FFFFFF',
    surfaceAlt: '#F3EBDD',
    glass: 'rgba(255, 255, 255, 0.88)',
    border: '#DED4C3',
    text: '#17212B',
    textSecondary: '#5F5C56',
    textMuted: '#77746D',
    primary: '#002147',
    onPrimary: '#FFFFFF',
    primarySoft: 'rgba(0, 33, 71, 0.08)',
    pill: '#FFFFFF',
    onPill: '#002147',
    round: '#002147',
    onRound: '#FFFFFF',
    cardStart: '#0C2035',
    cardEnd: '#002147',
    danger: '#B94A48',
    dangerSoft: '#F6E3E2',
    success: '#438453',
    successSoft: '#E3EFE5',
    warning: '#8A6A2E',
    warningSoft: '#F5EBD5',
    tabBar: '#FFFDF8',
    shadow: '#0C2035',
    gold: '#B68B40',
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
