import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';
import SectionHeader from '../../components/SectionHeader';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { getPlan, MEMBERSHIP_PLANS, MembershipPlan, SPORT_HOURS, SPORT_SECTIONS, TRAINING_PLAN } from '../../data/sport';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { dateNames } from '../../i18n/translations';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { addDays, formatDate, formatTenge } from '../../utils/format';
import type { ServiceScreenProps } from './types';

type Tab = 'membership' | 'training';

const DAY_MS = 24 * 60 * 60 * 1000;

/** SPORT — абонементы (оформление и срок действия), режим работы, секции и недельный план тренировок. */
export default function SportService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('membership');

  const membership = campus.membership && new Date(campus.membership.endsAt) > now ? campus.membership : null;
  const activePlan = membership ? getPlan(membership.planId) : undefined;
  // round, а не ceil: при переходе на летнее/зимнее время в периоде может «набежать» лишний час
  const daysLeft = membership && activePlan
    ? Math.min(activePlan.durationDays, Math.max(1, Math.round((new Date(membership.endsAt).getTime() - now.getTime()) / DAY_MS)))
    : 0;

  const buy = (plan: MembershipPlan) => {
    const apply = () =>
      updateCampus((prev) => ({
        ...prev,
        membership: { planId: plan.id, startedAt: new Date().toISOString(), endsAt: addDays(new Date(), plan.durationDays).toISOString() },
      }));
    if (membership) {
      Alert.alert(t('sportReplaceTitle'), t('sportReplaceText'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('sportBuy'), onPress: apply },
      ]);
    } else {
      apply();
    }
  };

  const toggleSection = (id: string) =>
    updateCampus((prev) => ({
      ...prev,
      enrolledSections: prev.enrolledSections.includes(id)
        ? prev.enrolledSections.filter((item) => item !== id)
        : [...prev.enrolledSections, id],
    }));

  return (
    <ServiceLayout service={service} onBack={onBack}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'membership', label: t('sportMembership') },
          { value: 'training', label: t('sportTraining') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'membership' ? (
        <>
          {membership && activePlan ? (
            <LinearGradient colors={[colors.cardStart, colors.cardEnd] as const} style={styles.activeCard}>
              <Text style={styles.activeLabel}>{t('sportActive').toUpperCase()}</Text>
              <Text style={styles.activeName}>{tr(activePlan.name)}</Text>
              <Text style={styles.activeText}>{t('sportValidUntil', { date: formatDate(membership.endsAt, language) })}</Text>
              <ProgressBar value={daysLeft / activePlan.durationDays} color="#FFFFFF" />
              <Text style={styles.activeText}>{t('sportDaysLeft', { days: daysLeft })}</Text>
              <PrimaryButton
                title={t('sportCancel')}
                variant="glass"
                compact
                onPress={() => updateCampus((prev) => ({ ...prev, membership: null }))}
              />
            </LinearGradient>
          ) : (
            <GlassCard style={styles.row}>
              <Ionicons name="card-outline" size={22} color={colors.textMuted} />
              <Text style={[type.body, { color: colors.textSecondary }]}>{t('sportNoMembership')}</Text>
            </GlassCard>
          )}

          {MEMBERSHIP_PLANS.map((plan) => {
            const isActive = activePlan?.id === plan.id;
            return (
              <GlassCard key={plan.id} style={isActive && { borderColor: colors.primary }}>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={[type.heading, { color: colors.text }]}>{tr(plan.name)}</Text>
                    <Text style={[type.caption, { color: colors.textMuted }]}>{t('sportDays', { days: plan.durationDays })}</Text>
                  </View>
                  <Text style={[type.title, { color: colors.text }]}>{formatTenge(plan.price)}</Text>
                </View>
                {plan.features.map((feature) => (
                  <View key={feature.en} style={styles.row}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={[type.body, styles.flex, { color: colors.textSecondary }]}>{tr(feature)}</Text>
                  </View>
                ))}
                <PrimaryButton
                  title={isActive ? t('sportActive') : t('sportBuy')}
                  arrow={!isActive}
                  variant={isActive ? 'glass' : 'light'}
                  disabled={isActive}
                  onPress={() => buy(plan)}
                />
              </GlassCard>
            );
          })}
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('sportPayNote')}</Text>
        </>
      ) : (
        <>
          <GlassCard>
            <Text style={[type.subheading, { color: colors.text }]}>{t('sportHours')}</Text>
            {SPORT_HOURS.map((item) => (
              <View key={item.days.en} style={styles.hoursRow}>
                <Text style={[type.body, { color: colors.textSecondary }]}>{tr(item.days)}</Text>
                <Text style={[type.bodyMedium, { color: colors.text }]}>{item.time}</Text>
              </View>
            ))}
          </GlassCard>

          <SectionHeader title={t('sportTraining')} />
          <GlassCard style={styles.plan}>
            {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
              const today = weekday === now.getDay();
              return (
                <View key={weekday} style={[styles.planRow, today && { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.planDay, { color: today ? colors.primary : colors.textMuted }]}>
                    {dateNames[language].weekdaysShort[weekday]}
                  </Text>
                  <Text style={[type.body, styles.flex, { color: colors.text }]}>{tr(TRAINING_PLAN[weekday])}</Text>
                  {today ? <Text style={[type.label, { color: colors.primary }]}>{t('today')}</Text> : null}
                </View>
              );
            })}
          </GlassCard>

          {SPORT_SECTIONS.map((section) => {
            const enrolled = campus.enrolledSections.includes(section.id);
            return (
              <GlassCard key={section.id}>
                <View style={styles.row}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={section.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[type.subheading, { color: colors.text }]}>{tr(section.name)}</Text>
                    <Text style={[type.caption, { color: colors.textSecondary }]}>{tr(section.schedule)}</Text>
                    <Text style={[type.caption, { color: colors.textMuted }]}>{t('sportCoach', { name: section.coach })}</Text>
                  </View>
                </View>
                <PrimaryButton
                  title={enrolled ? t('sportEnrolled') : t('sportEnroll')}
                  icon={enrolled ? 'checkmark-circle' : undefined}
                  variant={enrolled ? 'glass' : 'light'}
                  compact
                  arrow={!enrolled}
                  onPress={() => toggleSection(section.id)}
                />
              </GlassCard>
            );
          })}
        </>
      )}
    </ServiceLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  activeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.75)',
  },
  activeName: {
    fontFamily: fonts.regular,
    fontSize: 30,
    letterSpacing: -0.8,
    color: '#FFFFFF',
  },
  activeText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plan: {
    gap: 2,
    padding: spacing.sm,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  planDay: {
    width: 30,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
