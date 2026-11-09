import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { PASSWORD_MIN_LENGTH } from '../utils/validation';

type Props = {
  password: string;
  confirm: string;
};

/** Требования к паролю: галочка ставится, как только условие выполнено. */
export default function PasswordRules({ password, confirm }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const rules = [
    { ok: password.length >= PASSWORD_MIN_LENGTH, label: t('pwRuleLength', { min: PASSWORD_MIN_LENGTH }) },
    { ok: /[A-Za-zА-Яа-яЁё]/.test(password), label: t('pwRuleLetter') },
    { ok: /\d/.test(password), label: t('pwRuleDigit') },
    { ok: password.length > 0 && password === confirm, label: t('pwRuleMatch') },
  ];

  return (
    <View style={styles.list} accessibilityLiveRegion="polite">
      {rules.map((rule) => (
        <View key={rule.label} style={styles.row} accessibilityLabel={`${rule.label}: ${rule.ok ? t('pwRuleDone') : t('pwRuleTodo')}`}>
          <Ionicons name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={rule.ok ? colors.success : colors.textMuted} />
          <Text style={[type.caption, { color: rule.ok ? colors.success : colors.textSecondary }]}>{rule.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
