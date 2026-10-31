import { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SubscriptionBanner from '../components/SubscriptionBanner';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { useSignOut } from '../hooks/useSignOut';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

export default function SettingsScreen({ navigation }: MainTabScreenProps<'Settings'>) {
  const { colors, isDark, setMode } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { session, students, favorites } = useAppData();
  const signOut = useSignOut();

  const appName = Constants.expoConfig?.name ?? 'ALTushki';
  const appVersion = Constants.expoConfig?.version ?? t('notSpecified');
  const platformName = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <TopBar label={t('appName')} />
          <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
            {t('settingsTitle')}
          </Text>

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

          <Section title={t('account')}>
            <Row icon="person-outline" label={t('loginLabel')} value={session?.login ?? '—'} />
            <Row icon="shield-checkmark-outline" label={t('authType')} value={t('authTypeValue')} />
          </Section>

          <SubscriptionBanner onPress={() => navigation.navigate('Subscription')} />

          <Section title={t('dataOnDevice')}>
            <Row icon="people-outline" label={t('studentsInList')} value={String(students.length)} />
            <Row icon="star-outline" label={t('favoriteServices')} value={String(favorites.length)} />
            <Text style={[type.caption, styles.note, { color: colors.textMuted }]}>{t('storageNote')}</Text>
          </Section>

          <Section title={t('about')}>
            <Row icon="school-outline" label={t('appNameLabel')} value={appName} />
            <Row icon="pricetag-outline" label={t('version')} value={appVersion} />
            <Row icon="phone-portrait-outline" label={t('platform')} value={platformName} />
          </Section>

          <PrimaryButton title={t('signOut')} variant="danger" icon="log-out-outline" onPress={signOut} />
        </View>
      </ScrollView>
    </ScreenContainer>
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
  scroll: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: spacing.xl,
  },
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
    paddingVertical: spacing.md,
  },
});
