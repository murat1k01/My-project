import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { api, errorMessage } from '../api/client';
import type { Plan, PlanId, SubscriptionInfo } from '../api/types';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import FormBanner from '../components/FormBanner';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { confirmAction } from '../utils/dialogs';
import { formatDate, formatMoney } from '../utils/format';

type SavedCard = { id: string; last4: string };

/**
 * Тарифы и оформление. Настоящая платёжная система не подключена: подписка оформляется
 * в тестовом режиме с привязанной тестовой картой, деньги не списываются, и экран прямо об этом говорит.
 */
export default function SubscriptionScreen({ navigation }: RootStackScreenProps<'Subscription'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { user, subscription, refresh } = useAuth();
  const { data, loading, error, reload } = useApi<{ plans: Plan[]; paymentsEnabled: boolean }>('/api/plans');
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success' | 'info'; text: string } | null>(null);

  // При открытии уточняем статус подписки: она могла истечь
  useEffect(() => {
    if (user) void refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Привязанные тестовые карты: оплата подписки идёт только в тестовом режиме, деньги не списываются
  // Список обновляется при возвращении с экрана привязки карты
  const focused = useIsFocused();
  const cards = useApi<{ cards: SavedCard[] }>(user && focused ? '/api/payment-methods' : null);
  const cardList = cards.data?.cards ?? [];
  const [cardId, setCardId] = useState<string | null>(null);
  const selectedCard = cardList.find((card) => card.id === cardId) ?? cardList[0] ?? null;

  const checkout = async (plan: Plan) => {
    if (busy || !selectedCard) return;
    setBusy(true);
    setMessage(null);
    try {
      await api('POST', '/api/subscription/checkout', { plan: plan.id, mode: 'test', paymentMethodId: selectedCard.id });
      await refresh();
      setCheckoutPlan(null);
      setMessage({ kind: 'success', text: t('subActivatedTest', { last4: selectedCard.last4 }) });
    } catch (e) {
      setMessage({ kind: 'info', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const cancelSubscription = () => {
    confirmAction({
      title: t('subCancelTitle'),
      text: t('subCancelText'),
      confirm: t('subCancel'),
      cancel: t('back'),
      destructive: true,
      onConfirm: () => {
        void (async () => {
          setBusy(true);
          setMessage(null);
          try {
            await api<{ subscription: SubscriptionInfo }>('POST', '/api/subscription/cancel');
            await refresh();
            setMessage({ kind: 'success', text: t('subCanceled') });
          } catch (e) {
            setMessage({ kind: 'error', text: errorMessage(e) });
          } finally {
            setBusy(false);
          }
        })();
      },
    });
  };

  const choose = (plan: Plan) => {
    setMessage(null);
    setCheckoutPlan(plan);
  };

  const planName = (id: PlanId | null) => data?.plans.find((plan) => plan.id === id)?.name ?? '';

  return (
    <ScreenScroll title={t('subName')} subtitle={t('subTagline')} onBack={navigation.goBack}>
      <FormBanner kind="info" text={t('subTestBanner')} />
      {subscription.status === 'expired' ? <FormBanner text={t('subExpiredPlan', { plan: planName(subscription.previousPlan), date: subscription.expiresAt ? formatDate(subscription.expiresAt, language) : '' })} /> : null}
      {subscription.status === 'canceled' && subscription.expiresAt ? <FormBanner kind="info" text={t('subCanceledUntil', { date: formatDate(subscription.expiresAt, language) })} /> : null}
      {message ? <FormBanner kind={message.kind} text={message.text} /> : null}

      {checkoutPlan ? (
        <GlassCard style={{ borderColor: colors.primary }}>
          <Text style={[type.heading, { color: colors.text }]}>{t('subCheckout', { plan: checkoutPlan.name })}</Text>
          <Text style={[type.body, { color: colors.textSecondary }]}>
            {formatMoney(checkoutPlan.price, t('currency'))} / {checkoutPlan.period}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('subTestNote')}</Text>
          {cardList.length > 0 ? (
            <>
              <Text style={[type.label, { color: colors.textMuted }]}>{t('subChooseCard')}</Text>
              <View style={styles.cards}>
                {cardList.map((card) => (
                  <Chip key={card.id} icon="card-outline" label={`•••• ${card.last4}`} selected={selectedCard?.id === card.id} onPress={() => setCardId(card.id)} />
                ))}
              </View>
              <PrimaryButton title={t('subPayTest', { price: formatMoney(checkoutPlan.price, t('currency')) })} arrow loading={busy} onPress={() => void checkout(checkoutPlan)} />
            </>
          ) : (
            <>
              <Text style={[type.body, { color: colors.textSecondary }]}>{t('subNeedCard')}</Text>
              <PrimaryButton title={t('payBind')} icon="card-outline" arrow onPress={() => navigation.navigate('Payment')} />
            </>
          )}
          <PrimaryButton title={t('cancel')} variant="glass" compact onPress={() => setCheckoutPlan(null)} />
        </GlassCard>
      ) : null}

      <StateView loading={loading} error={error} hasData={data !== null} onRetry={() => void reload()}>
        {data?.plans.map((plan) => {
          const current = user !== null && plan.id === subscription.plan;
          return (
            <GlassCard key={plan.id} style={current ? { borderColor: colors.primary, borderWidth: 2 } : undefined}>
              <View style={styles.header}>
                <View style={styles.flex}>
                  <Text style={[type.heading, { color: colors.text }]}>{plan.name}</Text>
                  {current ? <Text style={[type.label, { color: colors.primary }]}>{t('subCurrentPlan')}</Text> : null}
                </View>
                <Text style={[type.subheading, { color: colors.text }]}>{plan.price > 0 ? `${formatMoney(plan.price, t('currency'))} / ${plan.period}` : t('busFree')}</Text>
              </View>
              {plan.features.map((feature) => (
                <View key={feature} style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={[type.body, styles.flex, { color: colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}
              {current && subscription.expiresAt && subscription.status === 'active' ? (
                <>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{t('subActiveUntil', { date: formatDate(subscription.expiresAt, language) })}</Text>
                  <PrimaryButton title={t('subCancel')} variant="danger" compact disabled={busy} onPress={cancelSubscription} />
                </>
              ) : null}
              {!current && plan.price > 0 ? <PrimaryButton title={t('subOpen')} arrow compact onPress={() => choose(plan)} /> : null}
            </GlassCard>
          );
        })}
      </StateView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
});
