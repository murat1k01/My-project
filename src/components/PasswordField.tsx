import { Ref, useState } from 'react';
import { Pressable, StyleSheet, TextInputInstance, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing, TOUCH_SIZE } from '../theme/metrics';
import FormField from './FormField';

type Props = TextInputProps & { label: string; error?: string; ref?: Ref<TextInputInstance> };

/** Поле пароля с кнопкой «показать/скрыть». */
export default function PasswordField(props: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      icon="lock-closed-outline"
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      rightAccessory={
        <Pressable
          onPress={() => setVisible((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={visible ? t('hidePassword') : t('showPassword')}
          hitSlop={8}
          style={styles.eye}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  eye: {
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    marginRight: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
