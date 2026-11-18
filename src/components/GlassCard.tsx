import { ReactNode } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useAppear } from '../hooks/useAppear';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** false — без анимации появления (например, внутри списков, которые часто обновляются) */
  animated?: boolean;
};

/** Полупрозрачная «стеклянная» карточка со скруглёнными углами. Плавно появляется при открытии раздела. */
export default function GlassCard({ children, style, animated = true }: Props) {
  const { colors } = useTheme();
  const appear = useAppear();
  return <Animated.View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }, style, animated && appear]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
});
