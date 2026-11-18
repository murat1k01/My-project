import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../api/client';
import { Text } from '../components/AppText';
import CardPreview from '../components/CardPreview';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { confirmAction } from '../utils/dialogs';
import { CardErrors, CardForm, cardDigits, formatCardNumber, validateCard } from '../utils/card';

type SavedCard = { id: string; brand: string; last4: string; expMonth: string; expYear: string; holder: string };

const EMPTY: CardForm = { number: '', month: '', year: '', holder: '', cvv: '' };

/**
 * «Оплата через Visa» в тестовом режиме: подходит любой номер из 16 цифр, деньги не списываются.
 * На сервер уходят только последние 4 цифры, срок и имя. CVV живёт только в памяти экрана и стирается после отправки.
 */
export default function PaymentScreen({ navigation }: RootStackScreenProps<'Payment'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const cards = useApi<{ cards: SavedCard[] }>('/api/payment-methods');
  const [form, setForm] = useState<CardForm>(EMPTY);
  const [errors, setErrors] = useState<CardErrors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success' | 'info'; text: string } | null>(null);

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
      const digits = cardDigits(form.number);
      await api('POST', '/api/payment-methods', { mode: 'test', holder: form.holder.trim(), last4: digits.slice(-4), expMonth: form.month, expYear: form.year });
      setForm(EMPTY);
      setMessage({ kind: 'success', text: t('payBound') });
      await cards.reload();
    } catch (e) {
      setMessage({ kind: 'error', text: errorMessage(e) });
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
          <GlassCard key={card.id}>
            <CardPreview compact digits={'•'.repeat(12) + card.last4} holder={card.holder} month={card.expMonth} year={card.expYear} />
            <View style={styles.saved}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <View style={styles.flex}>
              <Text style={[type.subheading, { color: colors.text }]}>{t('payTestCard')} •••• {card.last4}</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>
                {card.holder} · {card.expMonth}/{card.expYear}
              </Text>
            </View>
            <PrimaryButton title={t('payUnbind')} variant="danger" compact onPress={() => unbind(card)} />
            </View>
          </GlassCard>
        ))}
      </StateView>

      <FormBanner kind="info" text={t('payTestMode')} />

      <CardPreview digits={cardDigits(form.number)} holder={form.holder} month={form.month} year={form.year} />

      <GlassCard>
        <FormField
          label={t('payNumber')}
          icon="card-outline"
          value={formatCardNumber(form.number)}
          onChangeText={(v) => update('number', cardDigits(v).slice(0, 16))}
          keyboardType="number-pad"
          // Поля всегда начинаются пустыми: браузер не подставляет сохранённые данные
          autoComplete="off"
          maxLength={19}
          error={error('number')}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <FormField label={t('payMonth')} placeholder="MM" value={form.month} onChangeText={(v) => update('month', v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" autoComplete="off" maxLength={2} error={error('month')} />
          </View>
          <View style={styles.flex}>
            <FormField label={t('payYear')} placeholder="ГГГГ" value={form.year} onChangeText={(v) => update('year', v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" autoComplete="off" maxLength={4} error={error('year')} />
          </View>
        </View>
        <FormField label={t('payHolder')} value={form.holder} onChangeText={(v) => update('holder', v.toUpperCase())} autoCapitalize="characters" autoComplete="off" autoCorrect={false} error={error('holder')} />
        <FormField label="CVV" value={form.cvv} onChangeText={(v) => update('cvv', v.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" secureTextEntry autoComplete="off" maxLength={3} error={error('cvv')} />
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
