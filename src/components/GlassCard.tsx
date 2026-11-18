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

/**
 * Карточка раздела. В светлой теме — белая с мягкой тенью, в тёмной — полупрозрачная «стеклянная».
 * Плавно появляется при открытии раздела.
 */
export default function GlassCard({ children, style, animated = true }: Props) {
  const { colors, isDark } = useTheme();
  const appear = useAppear();
  const look = isDark ? { backgroundColor: colors.glass, borderColor: colors.border } : [styles.soft, { backgroundColor: colors.surface, borderColor: 'transparent', shadowColor: colors.shadow }];
  return <Animated.View style={[styles.card, look, style, animated && appear]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  soft: {
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
