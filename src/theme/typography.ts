import type { TextStyle } from 'react-native';

/**
 * Шрифт Inter (поддерживает кириллицу, включая казахские буквы).
 * На Android жирность задаётся отдельным файлом шрифта, поэтому используем fontFamily, а не fontWeight.
 */
export const fonts = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Готовые стили текста: крупные жирные заголовки (светлый минимал). */
export const type = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 37, letterSpacing: -0.8 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 31, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  subheading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
} satisfies Record<string, TextStyle>;
