import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import type { IoniconName } from '../types/Service';

type Props = {
  icon: IoniconName;
  label: string;
  width: number;
  onPress: () => void;
};

/** Кремовая плитка с линейной иконкой — сетка 3 × 3 на главном экране. При нажатии слегка уменьшается. */
export default function AcademicTile({ icon, label, width, onPress }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tile, { width, backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={28} color={isDark ? colors.gold : colors.primary} />
      <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 104,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: spacing.md,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  label: {
    fontFamily: fonts.card,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
});
