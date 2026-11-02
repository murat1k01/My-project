import { Ref } from 'react';
import { StyleProp, StyleSheet, Text as RNText, TextInput as RNTextInput, TextInputInstance, TextInputProps, TextProps, TextStyle } from 'react-native';
import { useFontScale } from '../theme/FontScaleContext';

/** Умножает размер шрифта и высоту строки на выбранный масштаб. */
function scaled(style: StyleProp<TextStyle>, scale: number): StyleProp<TextStyle> {
  if (scale === 1) return style;
  const flat = StyleSheet.flatten(style) ?? {};
  return [
    style,
    {
      fontSize: (flat.fontSize ?? 14) * scale,
      ...(flat.lineHeight ? { lineHeight: flat.lineHeight * scale } : {}),
    },
  ];
}

/**
 * Единая типографика приложения: все экраны импортируют Text и TextInput отсюда,
 * поэтому настройка «Размер текста» применяется сразу ко всему приложению.
 */
export function Text({ style, ...props }: TextProps) {
  const { scale } = useFontScale();
  return <RNText {...props} style={scaled(style, scale)} />;
}

export function TextInput({ style, ref, ...props }: TextInputProps & { ref?: Ref<TextInputInstance> }) {
  const { scale } = useFontScale();
  return <RNTextInput ref={ref} {...props} style={scaled(style, scale)} />;
}
