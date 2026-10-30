import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Полупрозрачная «стеклянная» карточка со скруглёнными углами. */
export default function GlassCard({ children, style }: Props) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
});
