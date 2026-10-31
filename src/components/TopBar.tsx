import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import IconButton from './IconButton';

type Props = {
  /** Небольшая подпись слева (например, «ALTushki»), если нет кнопки «Назад» */
  label?: string;
  onBack?: () => void;
  /** Кнопки действий текущего экрана справа (профиль и настройки — только в нижней навигации) */
  right?: ReactNode;
};

/** Верхняя панель: подпись или кнопка «Назад» слева, действия экрана справа. */
export default function TopBar({ label, onBack, right }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.row}>
      {onBack ? (
        <IconButton icon="chevron-back" variant="glass" accessibilityLabel={t('back')} onPress={onBack} />
      ) : (
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
          {label}
        </Text>
      )}
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.md,
  },
  label: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  right: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
