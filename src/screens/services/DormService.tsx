import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Chip from '../../components/Chip';
import FormField from '../../components/FormField';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import SectionHeader from '../../components/SectionHeader';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { DORM_RULES, isLaundryBusy, LAUNDRY_MACHINES, LAUNDRY_TIMES, MY_ROOM, REPAIR_CATEGORIES } from '../../data/dorm';
import { requestTimeline, STAGE_LABEL } from '../../data/requests';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import type { RepairCategory } from '../../types/Campus';
import { createId, dayKey, formatDateTime, formatDayMonth, minutesOfDay, normalizeText, toMinutes } from '../../utils/format';
import type { ServiceScreenProps } from './types';

/** DORM — моя комната, запись в прачечную, заявки на ремонт, гостевые пропуска и правила. */
export default function DormService({ service, onBack, openScreen }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow();
  const today = dayKey(now);

  const [machine, setMachine] = useState(LAUNDRY_MACHINES[0]);
  const [category, setCategory] = useState<RepairCategory>('plumbing');
  const [repairText, setRepairText] = useState('');
  const [repairError, setRepairError] = useState<string | undefined>();
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState<string | undefined>();

  const booking = campus.laundry && campus.laundry.date === today ? campus.laundry : null;
  const todayPasses = campus.guestPasses.filter((pass) => pass.date === today);

  const sendRepair = () => {
    const text = normalizeText(repairText);
    if (text.length < 5) {
      setRepairError(t('dormRepairRequired'));
      return;
    }
    updateCampus((prev) => ({
      ...prev,
      repairs: [{ id: createId(), category, text, createdAt: new Date().toISOString() }, ...prev.repairs],
    }));
    setRepairText('');
  };

  const createPass = () => {
    const name = normalizeText(guestName);
    if (name.length < 3) {
      setGuestError(t('dormGuestRequired'));
      return;
    }
    const code = `G-${Math.floor(1000 + Math.random() * 9000)}`;
    updateCampus((prev) => ({ ...prev, guestPasses: [{ id: createId(), guestName: name, code, date: today }, ...prev.guestPasses] }));
    setGuestName('');
  };

  return (
    <ServiceLayout service={service} onBack={onBack}>
      {/* Моя комната */}
      <LinearGradient colors={[colors.cardStart, colors.cardEnd] as const} style={styles.roomCard}>
        <Text style={styles.roomLabel}>{t('dormMyRoom').toUpperCase()}</Text>
        <Text style={styles.roomTitle}>{t('dormBuilding', { no: MY_ROOM.building })}</Text>
        <Text style={styles.roomText}>
          {t('dormRoomInfo', { room: MY_ROOM.room, floor: MY_ROOM.floor, count: MY_ROOM.neighbors })}
        </Text>
      </LinearGradient>

      {/* Прачечная */}
      <SectionHeader title={t('dormLaundry')} />
      <GlassCard>
        <View style={styles.wrap}>
          {LAUNDRY_MACHINES.map((no) => (
            <Chip key={no} label={t('dormMachine', { no })} icon="water-outline" selected={machine === no} onPress={() => setMachine(no)} />
          ))}
        </View>
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('dormLaundryHint')}</Text>
        <View style={styles.wrap}>
          {LAUNDRY_TIMES.map((time) => {
            const mine = booking?.machine === machine && booking.time === time;
            const past = toMinutes(time) < minutesOfDay(now);
            const busy = !mine && isLaundryBusy(machine, time, today);
            return (
              <Chip
                key={time}
                label={time}
                selected={mine}
                disabled={!mine && (busy || past)}
                icon={busy ? 'close-outline' : undefined}
                onPress={() => updateCampus((prev) => ({ ...prev, laundry: { machine, time, date: today } }))}
              />
            );
          })}
        </View>
        {booking ? (
          <View style={styles.bookedBox}>
            <View style={styles.row}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[type.bodyMedium, styles.flex, { color: colors.text }]}>
                {t('dormLaundryBooked', { time: booking.time, no: booking.machine })}
              </Text>
            </View>
            <PrimaryButton title={t('dormCancelBooking')} variant="danger" compact onPress={() => updateCampus((prev) => ({ ...prev, laundry: null }))} />
          </View>
        ) : null}
      </GlassCard>

      {/* Ремонт */}
      <SectionHeader title={t('dormRepair')} />
      <GlassCard>
        <View style={styles.wrap}>
          {REPAIR_CATEGORIES.map((item) => (
            <Chip key={item.id} label={t(item.label)} icon={item.icon} selected={category === item.id} onPress={() => setCategory(item.id)} />
          ))}
        </View>
        <FormField
          placeholder={t('dormRepairPlaceholder')}
          icon="create-outline"
          value={repairText}
          onChangeText={(text) => {
            setRepairText(text);
            if (repairError) setRepairError(undefined);
          }}
          error={repairError}
          multiline
        />
        <PrimaryButton title={t('dormRepairSend')} arrow onPress={sendRepair} />
      </GlassCard>

      {campus.repairs.length > 0 ? (
        <>
          <SectionHeader
            title={t('dormMyRequests')}
            right={<Chip label={t('requestsTitle')} icon="document-text-outline" onPress={() => openScreen('Requests')} />}
          />
          {campus.repairs.slice(0, 5).map((request) => {
            const timeline = requestTimeline(request.createdAt, now);
            const status = { label: STAGE_LABEL[timeline.stage], done: timeline.stage === 'resolved' };
            const meta = REPAIR_CATEGORIES.find((item) => item.id === request.category);
            return (
              <GlassCard key={request.id} style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={meta?.icon ?? 'construct-outline'} size={18} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={2}>
                    {request.text}
                  </Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{formatDateTime(request.createdAt, language)}</Text>
                </View>
                <View style={[styles.status, { backgroundColor: status.done ? colors.successSoft : colors.warningSoft }]}>
                  <Text style={[styles.statusText, { color: status.done ? colors.success : colors.warning }]}>{t(status.label)}</Text>
                </View>
              </GlassCard>
            );
          })}
        </>
      ) : null}

      {/* Гостевой пропуск */}
      <SectionHeader title={t('dormGuest')} />
      <GlassCard>
        <FormField
          placeholder={t('dormGuestPlaceholder')}
          icon="person-add-outline"
          value={guestName}
          onChangeText={(text) => {
            setGuestName(text);
            if (guestError) setGuestError(undefined);
          }}
          error={guestError}
          autoCapitalize="words"
        />
        <PrimaryButton title={t('dormGuestCreate')} arrow onPress={createPass} />
        {todayPasses.map((pass) => (
          <View key={pass.id} style={[styles.pass, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
            <Ionicons name="qr-code-outline" size={36} color={colors.primary} />
            <View style={styles.flex}>
              <Text style={[styles.passCode, { color: colors.text }]}>{pass.code}</Text>
              <Text style={[type.bodyMedium, { color: colors.text }]}>{pass.guestName}</Text>
              <Text style={[type.caption, { color: colors.textSecondary }]}>{t('dormGuestValid', { date: formatDayMonth(now, language) })}</Text>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Правила */}
      <SectionHeader title={t('dormRules')} />
      <GlassCard>
        {DORM_RULES.map((rule) => (
          <View key={rule.en} style={styles.row}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
            <Text style={[type.body, styles.flex, { color: colors.textSecondary }]}>{tr(rule)}</Text>
          </View>
        ))}
      </GlassCard>
    </ServiceLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  roomCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 4,
  },
  roomLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.75)',
  },
  roomTitle: {
    fontFamily: fonts.regular,
    fontSize: 28,
    letterSpacing: -0.8,
    color: '#FFFFFF',
  },
  roomText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  bookedBox: {
    gap: spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  pass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  passCode: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: 2,
  },
});
