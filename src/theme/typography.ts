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

/** Готовые стили текста: крупные тонкие заголовки, как в референсе. */
export const type = {
  display: { fontFamily: fonts.regular, fontSize: 36, lineHeight: 40, letterSpacing: -1.2 },
  title: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 33, letterSpacing: -0.8 },
  heading: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 25, letterSpacing: -0.4 },
  subheading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
} satisfies Record<string, TextStyle>;
