import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';

type Props = {
  title: string;
  /** Элементы справа (чипы, ссылки) */
  right?: ReactNode;
};

export default function SectionHeader({ title, right }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[type.heading, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  right: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
