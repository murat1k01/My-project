import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, TOUCH_SIZE } from '../theme/metrics';
import { fonts } from '../theme/typography';
import type { IoniconName } from '../types/Service';

type Variant = 'light' | 'primary' | 'glass' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IoniconName;
  /** Круглая кнопка со стрелкой ↗ справа — фирменный элемент дизайна */
  arrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Кнопка-«пилюля»: белая с тёмным текстом (основная), синяя, стеклянная или для опасных действий. */
export default function PrimaryButton({
  title,
  onPress,
  variant = 'light',
  icon,
  arrow = false,
  loading = false,
  disabled = false,
  compact = false,
  style,
}: Props) {
  const { colors, isDark } = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<Variant, { background: string; text: string; border: string }> = {
    // В светлой теме белая пилюля на светлом фоне не видна — используем тёмную
    light: isDark
      ? { background: colors.pill, text: colors.onPill, border: colors.pill }
      : { background: colors.round, text: colors.onRound, border: colors.round },
    primary: { background: colors.primary, text: colors.onPrimary, border: colors.primary },
    glass: { background: colors.glass, text: colors.text, border: colors.border },
    danger: { background: colors.dangerSoft, text: colors.danger, border: colors.dangerSoft },
  };
  const current = palette[variant];
  const height = compact ? TOUCH_SIZE : 54;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, isDisabled && styles.disabled, style]}
    >
      <View
        style={[
          styles.pill,
          { height, backgroundColor: current.background, borderColor: current.border },
          compact && styles.compactPill,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={current.text} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={current.text} /> : null}
            <Text style={[styles.title, compact && styles.compactTitle, { color: current.text }]} numberOfLines={1}>
              {title}
            </Text>
          </>
        )}
      </View>
      {arrow ? (
        <View
          style={[
            styles.arrow,
            { width: height, height, borderRadius: height / 2 },
            { backgroundColor: variant === 'primary' ? colors.round : colors.primary },
          ]}
        >
          <Feather name="arrow-up-right" size={compact ? 18 : 22} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
  },
  compactPill: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  compactTitle: {
    fontSize: 14,
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
