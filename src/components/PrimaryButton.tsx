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
  /** Круглый значок со стрелкой ↗ внутри кнопки (как «Lancez votre projet» в примере) */
  arrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Кнопка-«пилюля». Основной вариант контрастный: белая на тёмной теме, чёрная на светлой.
 * Стрелка — часть самой кнопки (контрастный кружок внутри), отдельных плавающих кружков нет.
 */
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

  const contrast = isDark
    ? { background: colors.pill, text: colors.onPill, border: colors.pill }
    : { background: colors.round, text: colors.onRound, border: colors.round };
  const palette: Record<Variant, { background: string; text: string; border: string }> = {
    light: contrast,
    primary: contrast,
    glass: { background: colors.glass, text: colors.text, border: colors.border },
    danger: { background: colors.dangerSoft, text: colors.danger, border: colors.dangerSoft },
  };
  const current = palette[variant];
  const height = compact ? TOUCH_SIZE : 54;
  const circle = height - 10;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.pill,
        { height, backgroundColor: current.background, borderColor: current.border },
        arrow && styles.withArrow,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={current.text} />
      ) : (
        <>
          {arrow ? (
            <View style={[styles.arrow, { width: circle, height: circle, borderRadius: circle / 2, backgroundColor: current.text }]}>
              <Feather name="arrow-up-right" size={compact ? 16 : 20} color={variant === 'glass' ? colors.background : current.background} />
            </View>
          ) : null}
          <View style={[styles.content, arrow && styles.contentWithArrow]}>
            {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={current.text} /> : null}
            <Text style={[styles.title, compact && styles.compactTitle, { color: current.text }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
  },
  withArrow: {
    paddingLeft: 5,
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  contentWithArrow: {
    flex: 1,
    // Компенсируем кружок слева, чтобы текст оставался по центру кнопки
    marginRight: 30,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  compactTitle: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
