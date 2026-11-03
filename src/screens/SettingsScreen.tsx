import { ReactNode } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import { useAuth } from '../context/AuthContext';
import { useSignOut } from '../hooks/useSignOut';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES, TranslationKey } from '../i18n/translations';
import { FontScaleId, useFontScale } from '../theme/FontScaleContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

const FONT_OPTIONS: { id: FontScaleId; label: TranslationKey }[] = [
  { id: 'small', label: 'fontSmall' },
  { id: 'standard', label: 'fontStandard' },
  { id: 'large', label: 'fontLarge' },
  { id: 'xlarge', label: 'fontXLarge' },
];

export default function SettingsScreen() {
  const { colors, isDark, setMode } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { scaleId, setScaleId } = useFontScale();
  const { user } = useAuth();
  const signOut = useSignOut();

  const appVersion = Constants.expoConfig?.version ?? t('notSpecified');
  const platformName = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : t('platformWeb');

  return (
    <ScreenScroll title={t('settingsTitle')}>
      <Section title={t('fontSize')}>
        <View style={styles.chips}>
          {FONT_OPTIONS.map((option) => (
            <Chip key={option.id} label={t(option.label)} selected={scaleId === option.id} onPress={() => setScaleId(option.id)} />
          ))}
        </View>
        <Text style={[type.body, styles.note, { color: colors.textSecondary }]}>{t('fontPreview')}</Text>
      </Section>

      <Section title={t('appearance')}>
        <Row icon={isDark ? 'moon' : 'sunny'} label={t('darkTheme')}>
          <Switch
            value={isDark}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            accessibilityLabel={t('darkTheme')}
          />
        </Row>
      </Section>

      <Section title={t('language')}>
        <View style={styles.chips}>
          {LANGUAGES.map((item) => (
            <Chip key={item.code} label={item.name} selected={language === item.code} onPress={() => setLanguage(item.code)} />
          ))}
        </View>
      </Section>

      <Section title={t('about')}>
        <Row icon="school-outline" label={t('appNameLabel')} value={t('appName')} />
        <Row icon="pricetag-outline" label={t('version')} value={appVersion} />
        <Row icon="phone-portrait-outline" label={t('platform')} value={platformName} />
      </Section>

      {user ? <PrimaryButton title={t('signOut')} variant="danger" icon="log-out-outline" onPress={signOut} /> : null}
    </ScreenScroll>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[type.label, styles.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

type RowProps = {
  icon: IoniconName;
  label: string;
  value?: string;
  /** Элемент управления справа (например, Switch) */
  children?: ReactNode;
};

function Row({ icon, label, value, children }: RowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[type.body, styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {value !== undefined ? (
        <Text style={[type.body, styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    maxWidth: '50%',
  },
  note: {
    paddingVertical: spacing.sm,
  },
});
