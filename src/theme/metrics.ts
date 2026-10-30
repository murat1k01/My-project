/** Единые отступы и радиусы скругления для всех экранов. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 32,
  pill: 999,
} as const;

/** Минимальный размер области нажатия (рекомендации Android/iOS). */
export const TOUCH_SIZE = 44;

/** Отступ контента от краёв экрана */
export const SCREEN_PADDING = 20;
