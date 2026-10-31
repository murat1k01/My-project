import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';
import { useCampus } from '../context/CampusContext';
import { getSubscriptionPlan, isSubscriptionActive, SUBSCRIPTION_PLANS } from '../data/subscription';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { addDays, formatDate, formatMoney } from '../utils/format';

/** Оформление подписки ALTushki Plus: выбор плана, демо-оформление, отмена. */
export default function SubscriptionScreen({ navigation }: RootStackScreenProps<'Subscription'>) {
  const { colors, isDark } = useTheme();
  const { t, language } = useI18n();
  const { campus, updateCampus } = useCampus();
  const [planId, setPlanId] = useState(SUBSCRIPTION_PLANS[1].id);

  const now = new Date();
  const active = isSubscriptionActive(campus.subscription, now) ? campus.subscription : null;
  const activePlan = active ? getSubscriptionPlan(active.planId) : undefined;
  const selected = getSubscriptionPlan(planId) ?? SUBSCRIPTION_PLANS[0];

  const subscribe = () => {
    const endsAt = addDays(new Date(), selected.durationDays).toISOString();
    updateCampus((prev) => ({ ...prev, subscription: { planId: selected.id, startedAt: new Date().toISOString(), endsAt } }));
    Alert.alert(t('subActivatedTitle'), t('subActivatedText', { date: formatDate(endsAt, language) }));
  };

  const cancel = () => {
    Alert.alert(t('subCancelTitle'), t('subCancelText'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('subCancel'), style: 'destructive', onPress: () => updateCampus((prev) => ({ ...prev, subscription: null })) },
    ]);
  };

  const benefits = [
    { icon: 'bicycle-outline' as const, text: t('subBenefitDelivery') },
    { icon: 'ribbon-outline' as const, text: t('subBenefitBadge') },
  ];

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <TopBar onBack={navigation.goBack} />
          <View style={styles.titleBlock}>
            <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
              {t('subName')}
            </Text>
            <Text style={[type.caption, { color: colors.textSecondary }]}>{t('subTagline')}</Text>
          </View>

          <LinearGradient colors={[colors.cardStart, colors.cardEnd] as const} style={styles.hero}>
            <Text style={styles.heroLabel}>{t('subCurrentPlan').toUpperCase()}</Text>
            <Text style={styles.heroTitle}>{activePlan ? t(activePlan.name) : t('subInactive')}</Text>
            {active ? <Text style={styles.heroText}>{t('subActiveUntil', { date: formatDate(active.endsAt, language) })}</Text> : null}
          </LinearGradient>

          <GlassCard>
            <Text style={[type.subheading, { color: colors.text }]}>{t('subBenefitsTitle')}</Text>
            {benefits.map((benefit) => (
              <View key={benefit.text} style={styles.benefit}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={benefit.icon} size={18} color={colors.text} />
                </View>
                <Text style={[type.body, styles.flex, { color: colors.text }]}>{benefit.text}</Text>
              </View>
            ))}
          </GlassCard>

          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = plan.id === planId;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setPlanId(plan.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.plan,
                  { backgroundColor: colors.glass, borderColor: isSelected ? colors.text : colors.border },
                ]}
              >
                <View style={[styles.radio, { borderColor: colors.text }]}>
                  {isSelected ? <View style={[styles.radioDot, { backgroundColor: isDark ? colors.pill : colors.round }]} /> : null}
                </View>
                <View style={styles.flex}>
                  <Text style={[type.subheading, { color: colors.text }]}>{t(plan.name)}</Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{t('sportDays', { days: plan.durationDays })}</Text>
                </View>
                <Text style={[type.heading, { color: colors.text }]}>{formatMoney(plan.price, t('currency'))}</Text>
              </Pressable>
            );
          })}

          <PrimaryButton title={t('subBuy', { price: formatMoney(selected.price, t('currency')) })} arrow onPress={subscribe} />
          {active ? <PrimaryButton title={t('subCancel')} variant="danger" onPress={cancel} /> : null}
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('subDemoNote')}</Text>
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
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 4,
  },
  heroLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.7)',
  },
  heroTitle: {
    fontFamily: fonts.regular,
    fontSize: 30,
    letterSpacing: -0.8,
    color: '#FFFFFF',
  },
  heroText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
