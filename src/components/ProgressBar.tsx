import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  /** Значение от 0 до 1 */
  value: number;
  color?: string;
  height?: number;
};

export default function ProgressBar({ value, color, height = 6 }: Props) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.border }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={{ width: `${clamped * 100}%`, height, borderRadius: height / 2, backgroundColor: color ?? colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
