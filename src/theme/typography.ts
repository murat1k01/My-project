import type { TextStyle } from 'react-native';

/**
 * Oxford Academic Premium: заголовки — академический шрифт с засечками Cormorant Garamond, текст — Inter.
 * Оба шрифта поддерживают кириллицу, включая казахские буквы.
 * На Android жирность задаётся отдельным файлом шрифта, поэтому используем fontFamily, а не fontWeight.
 */
export const fonts = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  serif: 'CormorantGaramond_600SemiBold',
  serifBold: 'CormorantGaramond_700Bold',
} as const;

/** Готовые стили текста: классические заголовки с засечками и строгие подписи капителью. */
export const type = {
  display: { fontFamily: fonts.serifBold, fontSize: 40, lineHeight: 44, letterSpacing: -0.2 },
  title: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 37 },
  heading: { fontFamily: fonts.serifBold, fontSize: 24, lineHeight: 29 },
  subheading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16, letterSpacing: 1.2 },
} satisfies Record<string, TextStyle>;
