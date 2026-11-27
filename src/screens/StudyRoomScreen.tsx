import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../api/client';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import ExampleNotice from '../components/ExampleNotice';
import FormBanner from '../components/FormBanner';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { images } from '../data/images';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import { dateNames } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { addDays, dayKey } from '../utils/format';

type Room = { id: string; name: string; building: string | null; capacity: number | null; equipment: string | null; imageKey: string | null };
type Slot = { slot: string; state: 'free' | 'busy' | 'mine' | 'past' };
type Booking = { id: string; date: string; slot: string; room: string; building: string | null };

const DAYS = 14;

/** Study Room: бронирование учебных комнат на два часа. Комнаты заполняет администратор. */
export default function StudyRoomScreen({ navigation }: RootStackScreenProps<'StudyRoom'>) {
  const { colors, isDark } = useTheme();
  const { t, language } = useI18n();
  const rooms = useApi<{ rooms: Room[]; slots: string[] }>('/api/study-rooms');
  const bookings = useApi<{ bookings: Booking[] }>('/api/study-bookings');
  const dates = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(new Date(), i)), []);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [date, setDate] = useState(dayKey(dates[0]));
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = rooms.data?.rooms ?? [];
  const room = list.find((r) => r.id === roomId) ?? list[0] ?? null;
  const slots = useApi<{ slots: Slot[] }>(room ? `/api/study-rooms/${encodeURIComponent(room.id)}/slots?date=${date}` : null);
  const heading = isDark ? colors.text : colors.primary;
  const label = (d: Date) => `${dateNames[language].weekdaysShort[d.getDay()]} ${d.getDate()}`;
  const end = (slot: string) => `${String(Number(slot.slice(0, 2)) + 2).padStart(2, '0')}:00`;

  const book = async () => {
    if (!room || !picked || busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api('POST', '/api/study-bookings', { roomId: room.id, date, slot: picked });
      setSuccess(t('srBooked', { room: room.name, time: `${picked}–${end(picked)}` }));
      setPicked(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      await Promise.all([slots.reload(), bookings.reload()]);
    }
  };

  const cancel = async (id: string) => {
    try {
      await api('DELETE', `/api/study-bookings/${encodeURIComponent(id)}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      await Promise.all([slots.reload(), bookings.reload()]);
    }
  };

  return (
    <ScreenScroll title={t('srTitle')} subtitle={t('srSubtitle')} onBack={navigation.goBack}>
      <ExampleNotice textKey="srExampleNote" />
      <StateView loading={rooms.loading} error={rooms.error} hasData={rooms.data !== null} empty={list.length === 0} emptyIcon="easel-outline" emptyTitle={t('srEmpty')} emptyText={t('srEmptyText')} onRetry={() => void rooms.reload()}>
        {room ? <Image source={images[(room.imageKey ?? 'serviceLib') as keyof typeof images] ?? images.serviceLib} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}

        <Text style={[type.heading, { color: heading }]}>{t('srChooseRoom')}</Text>
        <View style={styles.rooms}>
          {list.map((r) => {
            const active = r.id === room?.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => {
                  setRoomId(r.id);
                  setPicked(null);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.room, { backgroundColor: colors.surface, borderColor: active ? colors.gold : colors.border }, active && styles.roomActive, pressed && styles.pressed]}
              >
                <Ionicons name="easel-outline" size={24} color={isDark ? colors.gold : colors.primary} />
                <View style={styles.flex}>
                  <Text style={[styles.roomName, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{[r.building, r.capacity ? t('srCapacity', { n: r.capacity }) : null].filter(Boolean).join(' · ')}</Text>
                  {r.equipment ? <Text style={[type.caption, { color: colors.textMuted }]}>{r.equipment}</Text> : null}
                </View>
                {active ? <Ionicons name="checkmark-circle" size={22} color={colors.gold} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={[type.heading, { color: heading }]}>{t('srChooseTime')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {dates.map((d) => (
            <Chip
              key={dayKey(d)}
              label={label(d)}
              selected={dayKey(d) === date}
              onPress={() => {
                setDate(dayKey(d));
                setPicked(null);
              }}
            />
          ))}
        </ScrollView>
        <StateView loading={slots.loading} error={slots.error} hasData={slots.data !== null} onRetry={() => void slots.reload()}>
          <View style={styles.slots}>
            {slots.data?.slots.map((s) => {
              const selected = s.slot === picked;
              const disabled = s.state !== 'free';
              return (
                <Pressable
                  key={s.slot}
                  disabled={disabled}
                  onPress={() => setPicked(s.slot)}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  style={[
                    styles.slot,
                    { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border },
                    s.state === 'mine' && { borderColor: colors.gold },
                    disabled && s.state !== 'mine' && styles.slotDisabled,
                  ]}
                >
                  <Text style={[styles.slotTime, { color: selected ? colors.onPrimary : colors.text }]}>
                    {s.slot}–{end(s.slot)}
                  </Text>
                  <Text style={[type.caption, { color: selected ? colors.onPrimary : colors.textMuted }]}>
                    {s.state === 'free' ? t('srFree') : s.state === 'mine' ? t('libYours') : s.state === 'busy' ? t('libBusy') : t('laundryPast')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </StateView>

        {error ? <FormBanner text={error} /> : null}
        {success ? <FormBanner kind="success" text={success} /> : null}
        <PrimaryButton title={t('srBook')} icon="calendar-outline" loading={busy} disabled={!picked} onPress={() => void book()} />
      </StateView>

      {bookings.data && bookings.data.bookings.length > 0 ? (
        <View style={styles.rooms}>
          <Text style={[type.heading, { color: heading }]}>{t('srMine')}</Text>
          {bookings.data.bookings.map((b) => (
            <View key={b.id} style={[styles.room, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={22} color={colors.gold} />
              <View style={styles.flex}>
                <Text style={[styles.roomName, { color: colors.text }]}>{b.room}</Text>
                <Text style={[type.caption, { color: colors.textSecondary }]}>
                  {b.date.split('-').reverse().join('.')}, {b.slot}–{end(b.slot)}
                </Text>
              </View>
              <Chip label={t('dormCancelBooking')} icon="close" onPress={() => void cancel(b.id)} />
            </View>
          ))}
        </View>
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  photo: {
    width: '100%',
    height: 160,
    borderRadius: radius.lg,
  },
  rooms: {
    gap: spacing.sm,
  },
  room: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  roomActive: {
    borderWidth: 1.5,
  },
  roomName: {
    fontFamily: fonts.card,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.8,
  },
  chips: {
    gap: spacing.sm,
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slot: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  slotDisabled: {
    opacity: 0.5,
  },
  slotTime: {
    fontFamily: fonts.card,
    fontSize: 14,
  },
});
