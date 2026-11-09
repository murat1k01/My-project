import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../api/client';
import { Text } from '../components/AppText';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { createCardCryptogram, paymentsConfigured, PaymentsNotConfigured } from '../payments/provider';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { confirmAction } from '../utils/dialogs';
import { CardErrors, CardForm, cardDigits, formatCardNumber, validateCard } from '../utils/card';

type SavedCard = { id: string; brand: string; last4: string; expMonth: string; expYear: string; holder: string };

const EMPTY: CardForm = { number: '', month: '', year: '', holder: '', cvv: '' };

/**
 * «Оплата через Visa»: привязка карты через платёжного провайдера.
 * CVV хранится только в памяти этого экрана и стирается сразу после отправки; номер карты не сохраняется.
 */
export default function PaymentScreen({ navigation }: RootStackScreenProps<'Payment'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const cards = useApi<{ cards: SavedCard[]; configured: boolean }>('/api/payment-methods');
  const [form, setForm] = useState<CardForm>(EMPTY);
  const [errors, setErrors] = useState<CardErrors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success' | 'info'; text: string } | null>(null);
  const ready = paymentsConfigured() && cards.data?.configured === true;

  const update = (field: keyof CardForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setMessage(null);
  };

  const bind = async () => {
    if (busy) return;
    const next = validateCard(form);
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    Keyboard.dismiss();
    setBusy(true);
    setMessage(null);
    try {
      const cryptogram = await createCardCryptogram(form);
      const digits = cardDigits(form.number);
      await api('POST', '/api/payment-methods', { cryptogram, holder: form.holder.trim(), last4: digits.slice(-4), expMonth: form.month, expYear: form.year });
      setForm(EMPTY);
      setMessage({ kind: 'success', text: t('payBound') });
      await cards.reload();
    } catch (e) {
      setMessage(e instanceof PaymentsNotConfigured ? { kind: 'info', text: t('payNotConfigured') } : { kind: 'error', text: errorMessage(e) });
    } finally {
      // CVV не остаётся даже в памяти экрана
      setForm((prev) => ({ ...prev, cvv: '' }));
      setBusy(false);
    }
  };

  const unbind = (card: SavedCard) => {
    confirmAction({
      title: t('payUnbindTitle'),
      text: t('payUnbindText', { last4: card.last4 }),
      confirm: t('payUnbind'),
      cancel: t('cancel'),
      destructive: true,
      onConfirm: () => {
        void api('DELETE', `/api/payment-methods/${card.id}`)
          .then(() => cards.reload())
          .catch((e) => setMessage({ kind: 'error', text: errorMessage(e) }));
      },
    });
  };

  const error = (field: keyof CardForm) => (errors[field] ? t(errors[field]!) : undefined);

  return (
    <ScreenScroll title={t('payTitle')} subtitle={t('paySubtitle')} onBack={navigation.goBack}>
      <StateView loading={cards.loading} error={cards.error} hasData={cards.data !== null} onRetry={() => void cards.reload()}>
        {cards.data?.cards.map((card) => (
          <GlassCard key={card.id} style={styles.saved}>
            <Ionicons name="card" size={28} color={colors.primary} />
            <View style={styles.flex}>
              <Text style={[type.subheading, { color: colors.text }]}>Visa •••• {card.last4}</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>
                {card.holder} · {card.expMonth}/{card.expYear}
              </Text>
            </View>
            <PrimaryButton title={t('payUnbind')} variant="danger" compact onPress={() => unbind(card)} />
          </GlassCard>
        ))}
      </StateView>

      {!ready ? <FormBanner kind="info" text={t('payNotConfigured')} /> : null}

      <GlassCard>
        <FormField
          label={t('payNumber')}
          icon="card-outline"
          value={formatCardNumber(form.number)}
          onChangeText={(v) => update('number', cardDigits(v).slice(0, 16))}
          keyboardType="number-pad"
          autoComplete="cc-number"
          textContentType="creditCardNumber"
          maxLength={19}
          error={error('number')}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <FormField label={t('payMonth')} placeholder="MM" value={form.month} onChangeText={(v) => update('month', v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" autoComplete="cc-exp-month" maxLength={2} error={error('month')} />
          </View>
          <View style={styles.flex}>
            <FormField label={t('payYear')} placeholder="ГГГГ" value={form.year} onChangeText={(v) => update('year', v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" autoComplete="cc-exp-year" maxLength={4} error={error('year')} />
          </View>
        </View>
        <FormField label={t('payHolder')} placeholder="IVAN PETROV" value={form.holder} onChangeText={(v) => update('holder', v.toUpperCase())} autoCapitalize="characters" autoComplete="cc-name" error={error('holder')} />
        <FormField label="CVV" value={form.cvv} onChangeText={(v) => update('cvv', v.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" secureTextEntry autoComplete="cc-csc" maxLength={3} error={error('cvv')} />
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('paySecurityNote')}</Text>
        {message ? <FormBanner kind={message.kind} text={message.text} /> : null}
        <PrimaryButton title={t('payBind')} arrow loading={busy} onPress={bind} />
      </GlassCard>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
