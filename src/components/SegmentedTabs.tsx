import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/metrics';
import { fonts } from '../theme/typography';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Переключатель вкладок внутри экрана (например, «Места / Онлайн-книги»). */
export default function SegmentedTabs<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.glass, borderColor: colors.border }]} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.item, active && { backgroundColor: isDark ? colors.pill : colors.round }]}
          >
            <Text
              style={[styles.label, { color: active ? (isDark ? colors.onPill : colors.onRound) : colors.textSecondary }]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  item: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});
