import { ReactNode, Ref, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputInstance, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  icon?: IoniconName;
  /** Элемент справа внутри поля (например, кнопка «показать пароль») */
  rightAccessory?: ReactNode;
  /** В React 19 ref передаётся как обычный prop */
  ref?: Ref<TextInputInstance>;
};

/** Поле ввода в виде «стеклянной» пилюли с подписью и сообщением об ошибке. */
export default function FormField({ label, error, icon, rightAccessory, ref, onFocus, onBlur, style, ...inputProps }: Props) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[type.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.field, { borderColor, backgroundColor: colors.glass }]}>
        {icon ? <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          selectionColor={colors.primary}
          style={[styles.input, { color: colors.text }, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          accessibilityLabel={label ?? inputProps.placeholder}
          {...inputProps}
        />
        {rightAccessory}
      </View>
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={15} color={colors.danger} />
          <Text style={[type.caption, styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  errorText: {
    flex: 1,
  },
});
