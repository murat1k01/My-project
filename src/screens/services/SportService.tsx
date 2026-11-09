import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../../api/client';
import type { Membership } from '../../api/types';
import FormBanner from '../../components/FormBanner';
import Chip from '../../components/Chip';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import SectionHeader from '../../components/SectionHeader';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { MEMBERSHIP_PLANS, SPORT_HOURS, SPORT_SECTIONS, SPORT_SESSIONS, TRAINING_PLAN } from '../../data/sport';
import type { HealthStatus } from '../../types/Campus';
import type { TranslationKey } from '../../i18n/translations';
import { useApi } from '../../hooks/useApi';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { dateNames } from '../../i18n/translations';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { formatDate, formatMoney } from '../../utils/format';
import type { ServiceScreenProps } from './types';

type Tab = 'membership' | 'training';

const HEALTH: { id: HealthStatus; label: TranslationKey; icon: 'heart-circle' | 'alert-circle' | 'close-circle' }[] = [
  { id: 'healthy', label: 'healthHealthy', icon: 'heart-circle' },
  { id: 'limited', label: 'healthLimited', icon: 'alert-circle' },
  { id: 'exempt', label: 'healthExempt', icon: 'close-circle' },
];

const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** Спорт: состояние здоровья, расписание по каждому виду спорта и залу, секции и абонемент (оплата на месте, подтверждает администратор). */
export default function SportService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('membership');
  const membership = useApi<{ membership: Membership | null }>('/api/membership');
  const current = membership.data?.membership ?? null;
  const currentPlan = MEMBERSHIP_PLANS.find((plan) => plan.id === current?.planId);
  const [confirmPlanId, setConfirmPlanId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const changeMembership = async (action: () => Promise<unknown>, success: string) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setConfirmPlanId(null);
      setMessage({ kind: 'success', text: success });
    } catch (e) {
      setMessage({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
      await membership.reload();
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
          {message ? <FormBanner kind={message.kind} text={message.text} /> : null}
          {current && currentPlan ? (
            <GlassCard style={{ borderColor: colors.primary }}>
              <Text style={[type.label, { color: colors.primary }]}>{current.status === 'active' ? t('sportActive') : t('sportPending')}</Text>
              <Text style={[type.heading, { color: colors.text }]}>{tr(currentPlan.name)}</Text>
              <Text style={[type.body, { color: colors.textSecondary }]}>
                {current.status === 'active' && current.expiresAt ? t('sportValidUntil', { date: formatDate(current.expiresAt, language) }) : t('sportPendingText', { price: formatMoney(currentPlan.price, t('currency')) })}
              </Text>
              <PrimaryButton title={t('sportCancel')} variant="danger" compact loading={busy} onPress={() => void changeMembership(() => api('DELETE', '/api/membership'), t('sportCanceled'))} />
            </GlassCard>
          ) : null}
          {MEMBERSHIP_PLANS.map((plan) => (
            <GlassCard key={plan.id}>
              <View style={styles.planHeader}>
                <View style={styles.flex}>
                  <Text style={[type.heading, { color: colors.text }]}>{tr(plan.name)}</Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{t('sportDays', { days: plan.durationDays })}</Text>
                </View>
                <Text style={[type.title, { color: colors.text }]}>{formatMoney(plan.price, t('currency'))}</Text>
              </View>
              {plan.features.map((feature) => (
                <View key={feature.en} style={styles.row}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={[type.body, styles.flex, { color: colors.textSecondary }]}>{tr(feature)}</Text>
                </View>
              ))}
              {!current ? (
                confirmPlanId === plan.id ? (
                  <>
                    <Text style={[type.body, { color: colors.text }]}>{t('sportConfirmText', { price: formatMoney(plan.price, t('currency')) })}</Text>
                    <PrimaryButton title={t('sportConfirm')} arrow loading={busy} onPress={() => void changeMembership(() => api('POST', '/api/membership', { planId: plan.id }), t('sportRequested'))} />
                    <PrimaryButton title={t('cancel')} variant="glass" compact onPress={() => setConfirmPlanId(null)} />
                  </>
                ) : (
                  <PrimaryButton title={t('sportBuy')} arrow compact onPress={() => setConfirmPlanId(plan.id)} />
                )
              ) : null}
            </GlassCard>
          ))}
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('sportPayNote')}</Text>
        </>
      ) : (
        <>
          <HealthCard status={campus.health} onChange={(health) => updateCampus((prev) => ({ ...prev, health }))} />
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
                  </View>
                </View>
                <WeekSchedule sessions={SPORT_SESSIONS[section.id] ?? {}} today={now.getDay()} />
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

function HealthCard({ status, onChange }: { status: HealthStatus | null; onChange: (status: HealthStatus) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const current = HEALTH.find((item) => item.id === status);
  const tone = status === 'healthy' ? colors.success : status === 'limited' ? colors.warning : status === 'exempt' ? colors.danger : colors.textMuted;
  return (
    <GlassCard>
      <View style={styles.row}>
        <Ionicons name={current?.icon ?? 'help-circle-outline'} size={28} color={tone} />
        <View style={styles.flex}>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('healthTitle')}</Text>
          <Text style={[type.heading, { color: tone }]}>{current ? t(current.label) : t('healthUnknown')}</Text>
        </View>
      </View>
      <View style={styles.chips}>
        {HEALTH.map((item) => (
          <Chip key={item.id} label={t(item.label)} selected={item.id === status} onPress={() => onChange(item.id)} />
        ))}
      </View>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('healthNote')}</Text>
    </GlassCard>
  );
}

/** Неделя по дням: время занятия или прочерк, сегодняшний день выделен */
function WeekSchedule({ sessions, today }: { sessions: Partial<Record<number, string>>; today: number }) {
  const { colors } = useTheme();
  const { language } = useI18n();
  return (
    <View style={styles.week}>
      {WEEK.map((day) => {
        const time = sessions[day];
        const isToday = day === today;
        return (
          <View key={day} style={[styles.weekRow, isToday && { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.planDay, { color: isToday ? colors.primary : colors.textMuted }]}>{dateNames[language].weekdaysShort[day]}</Text>
            <Text style={[type.body, styles.flex, { color: time ? colors.text : colors.textMuted }]}>{time ?? '—'}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  week: {
    gap: 2,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
