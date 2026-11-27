import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../api/client';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import FormBanner from '../components/FormBanner';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { brand } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import { formatDateTime, formatMoney } from '../utils/format';

type Tx = { id: string; type: 'topup' | 'payment'; amount: number; title: string; createdAt: string };
type Wallet = { balance: number; testMode: boolean; transactions: Tx[] };
type Card = { id: string; last4: string };
type Purpose = 'food' | 'dorm' | 'tuition' | 'transport';

const TOPUPS = [1000, 5000, 10000];
const PURPOSES: { id: Purpose; icon: IoniconName; label: TranslationKey }[] = [
  { id: 'food', icon: 'restaurant-outline', label: 'walletFood' },
  { id: 'dorm', icon: 'bed-outline', label: 'walletDorm' },
  { id: 'tuition', icon: 'school-outline', label: 'walletTuition' },
  { id: 'transport', icon: 'bus-outline', label: 'walletTransport' },
];

/**
 * ALT Wallet: тёмно-синяя карточка баланса с золотой кнопкой пополнения, платежи и история.
 * Платёжная система не подключена, поэтому всё работает только в явно отмеченном тестовом режиме — настоящие деньги не списываются.
 */
export default function WalletScreen({ navigation }: RootStackScreenProps<'Wallet'>) {
  const { colors, isDark } = useTheme();
  const { t, language } = useI18n();
  const focused = useIsFocused();
  const wallet = useApi<Wallet>(focused ? '/api/wallet' : null);
  const cards = useApi<{ cards: Card[] }>(focused ? '/api/payment-methods' : null);
  const [panel, setPanel] = useState<'topup' | Purpose | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const card = cards.data?.cards[0] ?? null;
  const heading = isDark ? colors.text : colors.primary;

  const send = async (path: string, body: object, done: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api('POST', path, { ...body, mode: 'test' });
      setSuccess(done);
      setPanel(null);
      await wallet.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScroll title={t('walletTitle')} onBack={navigation.goBack}>
      <FormBanner kind="info" text={t('walletTestNote')} />
      <StateView loading={wallet.loading} error={wallet.error} hasData={wallet.data !== null} onRetry={() => void wallet.reload()}>
        <LinearGradient colors={[brand.deepNavy, brand.navy] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balance}>
          <View style={styles.flex}>
            <Text style={styles.balanceLabel}>{t('walletBalance')}</Text>
            <Text style={styles.balanceValue}>{formatMoney(wallet.data?.balance ?? 0, t('currency'))}</Text>
            <Text style={styles.testTag}>{t('walletTestTag')}</Text>
          </View>
          <Pressable onPress={() => setPanel(panel === 'topup' ? null : 'topup')} accessibilityRole="button" accessibilityLabel={t('walletTopup')} style={({ pressed }) => [styles.plus, pressed && styles.pressed]}>
            <Ionicons name="add" size={28} color={brand.navy} />
          </Pressable>
        </LinearGradient>

        {panel === 'topup' ? (
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.gold }]}>
            <Text style={[type.subheading, { color: colors.text }]}>{t('walletTopup')}</Text>
            {card ? (
              <>
                <Text style={[type.caption, { color: colors.textSecondary }]}>{t('walletCard', { last4: card.last4 })}</Text>
                <View style={styles.chips}>
                  {TOPUPS.map((amount) => (
                    <Chip key={amount} label={formatMoney(amount, t('currency'))} onPress={() => void send('/api/wallet/topup', { amount, paymentMethodId: card.id }, t('walletToppedUp'))} />
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={[type.caption, { color: colors.textSecondary }]}>{t('walletNoCard')}</Text>
                <PrimaryButton title={t('payOpen')} icon="card-outline" variant="glass" compact onPress={() => navigation.navigate('Payment')} />
              </>
            )}
          </View>
        ) : null}

        <Text style={[type.heading, { color: heading }]}>{t('walletPayments')}</Text>
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {PURPOSES.map((p, index) => (
            <View key={p.id} style={index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }}>
              <Pressable onPress={() => setPanel(panel === p.id ? null : p.id)} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Ionicons name={p.icon} size={21} color={isDark ? colors.gold : colors.primary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>{t(p.label)}</Text>
                <Ionicons name={panel === p.id ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.gold} />
              </Pressable>
              {panel === p.id ? (
                <View style={[styles.chips, styles.payChips]}>
                  {[500, 1500, 5000].map((amount) => (
                    <Chip key={amount} label={formatMoney(amount, t('currency'))} onPress={() => void send('/api/wallet/pay', { amount, purpose: p.id }, t('walletPaid'))} />
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {error ? <FormBanner text={error} /> : null}
        {success ? <FormBanner kind="success" text={success} /> : null}

        <Text style={[type.heading, { color: heading }]}>{t('walletHistory')}</Text>
        {(wallet.data?.transactions ?? []).length === 0 ? (
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('walletHistoryEmpty')}</Text>
        ) : (
          <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {wallet.data?.transactions.map((tx, index) => (
              <View key={tx.id} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Ionicons name={tx.type === 'topup' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'} size={22} color={tx.type === 'topup' ? colors.success : colors.danger} />
                <View style={styles.flex}>
                  <Text style={[type.body, { color: colors.text }]}>{tx.title}</Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{formatDateTime(tx.createdAt, language)}</Text>
                </View>
                <Text style={[styles.amount, { color: tx.type === 'topup' ? colors.success : colors.text }]}>
                  {tx.type === 'topup' ? '+' : '−'}
                  {formatMoney(tx.amount, t('currency'))}
                </Text>
              </View>
            ))}
          </View>
        )}
      </StateView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.5)',
  },
  balanceLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(248, 243, 232, 0.8)',
  },
  balanceValue: {
    fontFamily: fonts.serifBold,
    fontSize: 40,
    lineHeight: 46,
    color: brand.ivory,
  },
  testTag: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: brand.gold,
  },
  plus: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  panel: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  payChips: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  list: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.card,
    fontSize: 15,
  },
  amount: {
    fontFamily: fonts.card,
    fontSize: 15,
  },
});
