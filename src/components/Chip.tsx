import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import type { IoniconName } from '../types/Service';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IoniconName;
  disabled?: boolean;
};

/** Чип-фильтр: выбранный — контрастная «пилюля», остальные — стеклянные. */
export default function Chip({ label, selected = false, onPress, icon, disabled = false }: Props) {
  const { colors, isDark } = useTheme();
  const background = selected ? (isDark ? colors.pill : colors.round) : colors.glass;
  const color = selected ? (isDark ? colors.onPill : colors.onRound) : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: background, borderColor: selected ? background : colors.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={color} /> : null}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
});
