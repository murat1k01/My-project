import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

type Props = {
  kind?: 'error' | 'success' | 'info';
  text: string;
};

/** Сообщение прямо на экране: об ошибке, успехе или важное замечание. */
export default function FormBanner({ kind = 'error', text }: Props) {
  const { colors } = useTheme();
  const palette = {
    error: { background: colors.dangerSoft, color: colors.danger, icon: 'alert-circle' as const },
    success: { background: colors.successSoft, color: colors.success, icon: 'checkmark-circle' as const },
    info: { background: colors.primarySoft, color: colors.text, icon: 'information-circle-outline' as const },
  }[kind];

  return (
    <View style={[styles.box, { backgroundColor: palette.background }]} accessibilityLiveRegion="polite">
      <Ionicons name={palette.icon} size={18} color={palette.color} />
      <Text style={[type.caption, styles.flex, { color: palette.color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  flex: {
    flex: 1,
  },
});
