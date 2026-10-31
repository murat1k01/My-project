import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TOUCH_SIZE } from '../theme/metrics';
import { fonts } from '../theme/typography';
import type { IoniconName } from '../types/Service';

export type RoundVariant = 'light' | 'glass' | 'primary' | 'dark' | 'danger';

type Props = {
  icon: IoniconName;
  onPress: () => void;
  /** Обязательная подпись для экранного диктора */
  accessibilityLabel: string;
  variant?: RoundVariant;
  /** Число в кружке (например, количество избранных) */
  badge?: number;
  size?: number;
  iconColor?: string;
};

/** Круглая кнопка с иконкой — как кнопка меню «≡» и стрелки в референсе. */
export default function IconButton({ icon, onPress, accessibilityLabel, variant = 'glass', badge, size = TOUCH_SIZE, iconColor }: Props) {
  const { colors, isDark } = useTheme();

  // «primary» — контрастная кнопка (белая в тёмной теме, чёрная в светлой), без синего цвета
  const contrast = isDark
    ? { background: colors.pill, color: colors.onPill, border: colors.pill }
    : { background: colors.round, color: colors.onRound, border: colors.round };
  const palette: Record<RoundVariant, { background: string; color: string; border: string }> = {
    light: { background: colors.pill, color: colors.onPill, border: colors.pill },
    glass: { background: colors.glass, color: colors.text, border: colors.border },
    primary: contrast,
    dark: { background: colors.round, color: colors.onRound, border: colors.round },
    danger: { background: colors.dangerSoft, color: colors.danger, border: colors.dangerSoft },
  };
  const current = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: current.background, borderColor: current.border },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.45)} color={iconColor ?? current.color} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
});
