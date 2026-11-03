import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { api, errorMessage } from '../../api/client';
import type { Dorm, LaundryBooking, LaundrySlot, Machine } from '../../api/types';
import { Text } from '../../components/AppText';
import Chip from '../../components/Chip';
import FormBanner from '../../components/FormBanner';
import FormField from '../../components/FormField';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import SectionHeader from '../../components/SectionHeader';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import StateView from '../../components/StateView';
import { useApi } from '../../hooks/useApi';
import { useI18n } from '../../i18n/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/metrics';
import { type } from '../../theme/typography';
import { addDays, dayKey, formatDayMonth } from '../../utils/format';
import type { ServiceScreenProps } from './types';

type Tab = 'laundry' | 'info' | 'repair';

const DAYS_AHEAD = 7;

const REPAIR_CATEGORIES: TranslationKey[] = ['dormCatPlumbing', 'dormCatElectric', 'dormCatFurniture', 'dormCatInternet'];

/** Общежитие: сведения заполняет администратор, стирка и заявки работают через сервер. */
export default function DormService({ service, onBack, openScreen }: ServiceScreenProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('laundry');
  const dorms = useApi<{ dorms: Dorm[]; slots: string[] }>('/api/dorms');
  const [dormId, setDormId] = useState<string | null>(null);
  const dorm = dorms.data?.dorms.find((item) => item.id === dormId) ?? dorms.data?.dorms[0] ?? null;

  return (
    <ServiceLayout service={service} onBack={onBack} notice={null}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'laundry', label: t('dormLaundry') },
          { value: 'info', label: t('dormInfo') },
          { value: 'repair', label: t('dormRepairTab') },
        ]}
        value={tab}
        onChange={setTab}
      />

      <StateView
        loading={dorms.loading}
        error={dorms.error}
        hasData={dorms.data !== null}
        empty={dorms.data?.dorms.length === 0}
        emptyIcon="bed-outline"
        emptyTitle={t('dormEmptyTitle')}
        emptyText={t('dormEmptyText')}
        onRetry={() => void dorms.reload()}
      >
        {dorms.data && dorms.data.dorms.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {dorms.data.dorms.map((item) => (
              <Chip key={item.id} label={item.name} selected={item.id === dorm?.id} onPress={() => setDormId(item.id)} />
            ))}
          </ScrollView>
        ) : null}

        {dorm && tab === 'info' ? <DormInfo dorm={dorm} /> : null}
        {dorm && tab === 'laundry' ? (
          <Laundry key={dorm.id} dorm={dorm} />
        ) : null}
        {tab === 'repair' ? (
          <RepairForm onOpenRequests={() => openScreen('Requests')} />
        ) : null}
      </StateView>
    </ServiceLayout>
  );
}

function DormInfo({ dorm }: { dorm: Dorm }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const rows: [TranslationKey, string | null][] = [
    ['dormAddress', dorm.address],
    ['dormContacts', dorm.contacts],
    ['dormServices', dorm.services],
    ['dormHours', dorm.hours],
    ['dormRules', dorm.rules],
  ];
  return (
    <GlassCard>
      <Text style={[type.heading, { color: colors.text }]}>{dorm.name}</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.fact}>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t(label)}</Text>
          <Text style={[type.body, { color: value ? colors.text : colors.textMuted }]}>{value || t('notFilledByAdmin')}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

function Laundry({ dorm }: { dorm: Dorm }) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const machines = useApi<{ machines: Machine[] }>(`/api/dorms/${encodeURIComponent(dorm.id)}/machines`);
  const bookings = useApi<{ bookings: LaundryBooking[] }>('/api/laundry/bookings');
  const [floor, setFloor] = useState<number | null>(null);
  const [machineId, setMachineId] = useState<string | null>(null);
  const dates = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)), []);
  const [date, setDate] = useState(dayKey(dates[0]));
  const [pending, setPending] = useState<{ key: string; slot: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = machines.data?.machines ?? [];
  const floors = [...new Set(list.map((m) => m.floor).filter((f): f is number => f !== null))];
  const activeFloor = floor ?? floors[0] ?? null;
  const onFloor = list.filter((m) => activeFloor === null || m.floor === activeFloor);
  const machine = onFloor.find((m) => m.id === machineId) ?? onFloor[0] ?? null;

  const slots = useApi<{ slots: LaundrySlot[] }>(machine && machine.status === 'ok' ? `/api/laundry/slots?machine=${encodeURIComponent(machine.id)}&date=${date}` : null);

  // Подтверждение относится к конкретной машине и дате: при смене выбора оно сбрасывается само
  const pendingKey = `${machine?.id}|${date}`;
  const pendingSlot = pending?.key === pendingKey ? pending.slot : null;

  const book = async () => {
    if (!machine || !pendingSlot || busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api('POST', '/api/laundry/bookings', { machineId: machine.id, date, slot: pendingSlot });
      setSuccess(t('laundryBooked', { machine: machine.name, time: pendingSlot }));
      setPending(null);
    } catch (e) {
      // Например, слот только что занял другой студент: сервер это проверяет, поэтому обновляем сетку
      setError(errorMessage(e));
      setPending(null);
    } finally {
      setBusy(false);
      await Promise.all([slots.reload(), bookings.reload()]);
    }
  };

  const cancel = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api('DELETE', `/api/laundry/bookings/${encodeURIComponent(id)}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      await Promise.all([slots.reload(), bookings.reload()]);
    }
  };

  const slotLabel: Record<LaundrySlot['state'], string> = { free: '', busy: t('libBusy'), mine: t('libYours'), past: t('laundryPast') };

  return (
    <View style={styles.block}>
      {bookings.data && bookings.data.bookings.length > 0 ? (
        <>
          <SectionHeader title={t('laundryMine')} />
          {bookings.data.bookings.map((item) => (
            <GlassCard key={item.id}>
              <Text style={[type.bodyMedium, { color: colors.text }]}>
                {formatDayMonth(new Date(`${item.date}T00:00:00`), language)}, {item.slot}
              </Text>
              <Text style={[type.caption, { color: colors.textSecondary }]}>
                {item.dorm} · {item.machine}
                {item.floor !== null ? ` · ${t('libFloor', { n: item.floor })}` : ''}
              </Text>
              <PrimaryButton title={t('dormCancelBooking')} variant="danger" compact disabled={busy} onPress={() => void cancel(item.id)} />
            </GlassCard>
          ))}
        </>
      ) : null}

      <SectionHeader title={t('laundryNew')} />
      <StateView
        loading={machines.loading}
        error={machines.error}
        hasData={machines.data !== null}
        empty={list.length === 0}
        emptyIcon="water-outline"
        emptyTitle={t('laundryNoMachines')}
        emptyText={t('laundryNoMachinesText')}
        onRetry={() => void machines.reload()}
      >
        {floors.length > 0 ? (
          <Picker label={t('laundryFloor')}>
            {floors.map((value) => (
              <Chip key={value} label={String(value)} selected={value === activeFloor} onPress={() => setFloor(value)} />
            ))}
          </Picker>
        ) : null}
        <Picker label={t('laundryMachine')}>
          {onFloor.map((item) => (
            <Chip key={item.id} label={item.name} icon={item.status === 'ok' ? undefined : 'construct-outline'} selected={item.id === machine?.id} onPress={() => setMachineId(item.id)} />
          ))}
        </Picker>
        <Picker label={t('laundryDate')}>
          {dates.map((value) => (
            <Chip key={dayKey(value)} label={formatDayMonth(value, language)} selected={dayKey(value) === date} onPress={() => setDate(dayKey(value))} />
          ))}
        </Picker>

        {machine?.status === 'maintenance' ? <FormBanner kind="info" text={t('laundryMaintenance')} /> : null}
        {machine?.status === 'ok' ? (
          <StateView loading={slots.loading} error={slots.error} hasData={slots.data !== null} onRetry={() => void slots.reload()}>
            <View style={styles.slots}>
              {slots.data?.slots.map((item) => (
                <Chip
                  key={item.slot}
                  label={slotLabel[item.state] ? `${item.slot} · ${slotLabel[item.state]}` : item.slot}
                  selected={item.slot === pendingSlot || item.state === 'mine'}
                  disabled={item.state !== 'free'}
                  onPress={() => setPending({ key: pendingKey, slot: item.slot })}
                />
              ))}
            </View>
          </StateView>
        ) : null}

        {pendingSlot && machine ? (
          <GlassCard style={{ borderColor: colors.primary }}>
            <Text style={[type.bodyMedium, { color: colors.text }]}>{t('laundryConfirmText', { machine: machine.name, date: formatDayMonth(new Date(`${date}T00:00:00`), language), time: pendingSlot })}</Text>
            <PrimaryButton title={t('laundryConfirm')} arrow loading={busy} onPress={() => void book()} />
          </GlassCard>
        ) : null}
      </StateView>

      {error ? <FormBanner text={error} /> : null}
      {success ? <FormBanner kind="success" text={success} /> : null}
    </View>
  );
}

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.picker}>
      <Text style={[type.label, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
    </View>
  );
}

function RepairForm({ onOpenRequests }: { onOpenRequests: () => void }) {
  const { t } = useI18n();
  const [category, setCategory] = useState<TranslationKey>(REPAIR_CATEGORIES[0]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (sending) return;
    if (text.trim().length < 5) {
      setError(t('dormRepairRequired'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await api('POST', '/api/requests', { kind: 'repair', category: t(category), text });
      setText('');
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <GlassCard>
      <View style={styles.slots}>
        {REPAIR_CATEGORIES.map((key) => (
          <Chip key={key} label={t(key)} selected={key === category} onPress={() => setCategory(key)} />
        ))}
      </View>
      <FormField
        placeholder={t('dormRepairPlaceholder')}
        value={text}
        multiline
        onChangeText={(value) => {
          setText(value);
          setSent(false);
        }}
      />
      {error ? <FormBanner text={error} /> : null}
      {sent ? <FormBanner kind="success" text={t('dormRepairSent')} /> : null}
      <PrimaryButton title={t('dormRepairSend')} arrow loading={sending} onPress={send} />
      <PrimaryButton title={t('requestsTitle')} variant="glass" compact onPress={onOpenRequests} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.md,
  },
  chips: {
    gap: spacing.sm,
  },
  fact: {
    gap: 2,
  },
  picker: {
    gap: spacing.sm,
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
