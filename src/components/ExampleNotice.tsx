import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

type Props = {
  textKey?: TranslationKey;
};

/** Короткое пояснение к разделу: откуда данные и что с ними можно сделать. */
export default function ExampleNotice({ textKey = 'sectionNote' }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.box, { backgroundColor: colors.glass, borderColor: colors.border }]} accessibilityRole="text">
      <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
      <Text style={[type.caption, styles.text, { color: colors.textSecondary }]}>{t(textKey)}</Text>
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
    borderWidth: 1,
  },
  text: {
    flex: 1,
  },
});
