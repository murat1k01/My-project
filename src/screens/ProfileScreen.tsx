import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExampleNotice from '../components/ExampleNotice';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ProfileCard from '../components/ProfileCard';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { useCampus } from '../context/CampusContext';
import { useSignOut } from '../hooks/useSignOut';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import { formatDateTime } from '../utils/format';

/**
 * Профиль текущего пользователя. Заполнять его не нужно:
 * показаны примерные данные с пометкой «важно заполнить реальные сведения».
 */
export default function ProfileScreen(_props: MainTabScreenProps<'Profile'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { session, favorites } = useAppData();
  const { campus } = useCampus();
  const signOut = useSignOut();

  if (!session) return null;

  // Имя для аватара берём из логина: «aruzhan.serik» → «Aruzhan Serik»
  const [first = session.login, last = ''] = session.login.split(/[._-]/);
  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  const membershipActive = campus.membership !== null && new Date(campus.membership.endsAt) > new Date();

  const stats: { icon: IoniconName; label: string; value: string }[] = [
    { icon: 'receipt-outline', label: t('activityOrders'), value: String(campus.orders.length) },
    { icon: 'star-outline', label: t('activityFavorites'), value: String(favorites.length) },
    { icon: 'barbell-outline', label: t('activityMembership'), value: membershipActive ? t('activityActive') : t('none') },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <TopBar label={t('appName')} />
          <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
            {t('profileTitle')}
          </Text>

          <ExampleNotice textKey="profileExampleNote" />

          <ProfileCard
            firstName={capitalize(first)}
            lastName={capitalize(last)}
            seed={session.login}
            badge="IS-23"
            rows={[
              { icon: 'business-outline', label: t('profileFaculty'), value: t('exampleFaculty') },
              { icon: 'school-outline', label: t('program'), value: t('exampleProgram') },
              { icon: 'people-outline', label: t('group'), value: 'IS-23' },
              { icon: 'ribbon-outline', label: t('profileCourse'), value: '2' },
              { icon: 'card-outline', label: t('profileStudentId'), value: 'S-2026-0142' },
              { icon: 'mail-outline', label: t('profileEmail'), value: `${session.login.toLowerCase()}@campus.edu.kz` },
            ]}
          />

          <GlassCard>
            <Text style={[type.label, { color: colors.textMuted }]}>{t('myAccount').toUpperCase()}</Text>
            <View style={styles.accountRow}>
              <View style={[styles.accountIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="key-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={[type.subheading, { color: colors.text }]}>{session.login}</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  {t('signedInAt', { date: formatDateTime(session.signedInAt, language) })}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.warningSoft }]}>
                <Text style={[styles.badgeText, { color: colors.warning }]}>{t('studyLogin')}</Text>
              </View>
            </View>
          </GlassCard>

          <Text style={[type.heading, { color: colors.text }]}>{t('myActivity')}</Text>
          <View style={styles.stats}>
            {stats.map((stat) => (
              <GlassCard key={stat.label} style={styles.stat}>
                <Ionicons name={stat.icon} size={20} color={colors.primary} />
                <Text style={[type.title, { color: colors.text }]} numberOfLines={1}>
                  {stat.value}
                </Text>
                <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {stat.label}
                </Text>
              </GlassCard>
            ))}
          </View>

          <PrimaryButton title={t('signOut')} variant="danger" icon="log-out-outline" onPress={signOut} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
});
