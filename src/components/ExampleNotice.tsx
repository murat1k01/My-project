import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';

type Props = {
  /** Свой текст вместо стандартного «Это примерные данные — важно заполнить…» */
  textKey?: TranslationKey;
};

/** Пометка, что на экране примерные данные, которые важно заменить реальными. */
export default function ExampleNotice({ textKey = 'exampleNotice' }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.box, { backgroundColor: colors.warningSoft }]} accessibilityRole="text">
      <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
      <Text style={[type.caption, styles.text, { color: colors.text }]}>
        <Text style={[styles.badge, { color: colors.warning }]}>{t('exampleBadge')} · </Text>
        {t(textKey)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
  },
  badge: {
    fontFamily: fonts.bold,
  },
});
