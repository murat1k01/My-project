import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import SectionHeader from '../../components/SectionHeader';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { MEMBERSHIP_PLANS, SPORT_HOURS, SPORT_SECTIONS, TRAINING_PLAN } from '../../data/sport';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { dateNames } from '../../i18n/translations';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { formatMoney } from '../../utils/format';
import type { ServiceScreenProps } from './types';

type Tab = 'membership' | 'training';

/** Спорт: примеры абонементов (купить в приложении нельзя), режим работы, секции и недельный план тренировок. */
export default function SportService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('membership');

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
            </GlassCard>
          ))}
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
