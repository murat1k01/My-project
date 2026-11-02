import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../components/GlassCard';
import LibraryPlan from '../../components/LibraryPlan';
import PrimaryButton from '../../components/PrimaryButton';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { isSeatBusy, SEAT_ROWS, SEATS_PER_ROW } from '../../data/library';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { dayKey } from '../../utils/format';
import { notify } from '../../utils/dialogs';
import type { ServiceScreenProps } from './types';

type Tab = 'seats' | 'plan';
type SeatState = 'free' | 'busy' | 'mine';

/**
 * Читальный зал: пример схемы мест и плана этажей. Занятость мест не связана с настоящим залом,
 * об этом говорит пометка на экране. Каталог книг находится на вкладке «Библиотека».
 */
export default function LibraryService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('seats');
  const [floor, setFloor] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Бронь действует только в тот день, на который сделана
  const mySeat = campus.seat && campus.seat.date === dayKey(now) ? campus.seat.seatId : null;

  const seatState = (seatId: string): SeatState => {
    if (seatId === mySeat) return 'mine';
    return isSeatBusy(seatId, now) ? 'busy' : 'free';
  };

  const allSeats = SEAT_ROWS.flatMap((row) => Array.from({ length: SEATS_PER_ROW }, (_, i) => `${row}${i + 1}`));
  const freeCount = allSeats.filter((seatId) => seatState(seatId) !== 'busy').length;

  const handleSeatPress = (seatId: string) => {
    const state = seatState(seatId);
    if (state === 'busy') {
      notify(t('libHall'), t('libSeatBusy'));
      return;
    }
    if (state === 'free') {
      updateCampus((prev) => ({ ...prev, seat: { seatId, date: dayKey(now) } }));
    }
  };

  const seatColors: Record<SeatState, { background: string; border: string; text: string }> = {
    free: { background: colors.successSoft, border: colors.success, text: colors.success },
    busy: { background: colors.glass, border: colors.border, text: colors.textMuted },
    mine: { background: colors.primary, border: colors.primary, text: colors.onPrimary },
  };
  const statusLabel: Record<SeatState, string> = { free: t('libFree'), busy: t('libBusy'), mine: t('libYours') };

  return (
    <ServiceLayout service={service} onBack={onBack} notice="libSeatsNote">
      <SegmentedTabs<Tab>
        options={[
          { value: 'seats', label: t('libSeats') },
          { value: 'plan', label: t('libPlan') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'seats' ? (
        <>
          <GlassCard>
            <View style={styles.hallHeader}>
              <Text style={[type.heading, { color: colors.text }]}>
                {t('libHall')} · {t('libFloor', { n: 2 })}
              </Text>
              <Text style={[type.caption, { color: colors.success }]}>{t('libFreeCount', { free: freeCount, total: allSeats.length })}</Text>
            </View>

            <View style={styles.legend}>
              {(['free', 'busy', 'mine'] as SeatState[]).map((state) => (
                <View key={state} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: seatColors[state].background, borderColor: seatColors[state].border }]} />
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{statusLabel[state]}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.screenBar, { backgroundColor: colors.border }]} />

            {SEAT_ROWS.map((row) => (
              <View key={row} style={styles.seatRow}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{row}</Text>
                {Array.from({ length: SEATS_PER_ROW }, (_, i) => {
                  const seatId = `${row}${i + 1}`;
                  const state = seatState(seatId);
                  const palette = seatColors[state];
                  return (
                    <Pressable
                      key={seatId}
                      onPress={() => handleSeatPress(seatId)}
                      accessibilityRole="button"
                      accessibilityLabel={t('libSeatA11y', { seat: seatId, status: statusLabel[state] })}
                      style={({ pressed }) => [
                        styles.seat,
                        { backgroundColor: palette.background, borderColor: palette.border },
                        i === 2 && styles.aisle,
                        pressed && styles.pressed,
                      ]}
                    >
                      {state === 'busy' ? (
                        <Ionicons name="person" size={14} color={palette.text} />
                      ) : (
                        <Text style={[styles.seatText, { color: palette.text }]}>{i + 1}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('libTapHint')}</Text>
          </GlassCard>

          {mySeat ? (
            <GlassCard style={{ borderColor: colors.primary }}>
              <View style={styles.reservedRow}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                <Text style={[type.bodyMedium, styles.flex, { color: colors.text }]}>{t('libReserved', { seat: mySeat })}</Text>
              </View>
              <PrimaryButton
                title={t('libCancel')}
                variant="danger"
                compact
                onPress={() => updateCampus((prev) => ({ ...prev, seat: null }))}
              />
            </GlassCard>
          ) : null}
        </>
      ) : null}

      {tab === 'plan' ? (
        <LibraryPlan
          floor={floor}
          onFloorChange={setFloor}
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
        />
      ) : null}
    </ServiceLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  screenBar: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    width: 16,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  seat: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aisle: {
    marginRight: spacing.md,
  },
  seatText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  reservedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
