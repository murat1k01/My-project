import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { isSeatBusy, ONLINE_BOOKS, SEAT_ROWS, SEATS_PER_ROW } from '../../data/library';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { dayKey } from '../../utils/format';
import { openExternal } from '../../utils/links';
import type { ServiceScreenProps } from './types';

type Tab = 'seats' | 'books';
type SeatState = 'free' | 'busy' | 'mine';

/** LIB — схема читального зала со свободными и занятыми местами, бронь места и онлайн-книги. */
export default function LibraryService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('seats');

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
      Alert.alert(t('libHall'), t('libSeatBusy'));
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
    <ServiceLayout service={service} onBack={onBack}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'seats', label: t('libSeats') },
          { value: 'books', label: t('libBooks') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'seats' ? (
        <>
          <GlassCard>
            <View style={styles.hallHeader}>
              <Text style={[type.heading, { color: colors.text }]}>{t('libHall')}</Text>
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
      ) : (
        <>
          <Text style={[type.caption, { color: colors.textSecondary }]}>{t('libBooksNote')}</Text>
          {ONLINE_BOOKS.map((book) => (
            <GlassCard key={book.id} style={styles.book}>
              {/* Обложку рисуем сами: градиент + первые буквы названия */}
              <LinearGradient colors={book.colors} style={styles.cover}>
                <Text style={styles.coverText} numberOfLines={3}>
                  {tr(book.title)}
                </Text>
                <Ionicons name="book" size={16} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
              <View style={styles.bookInfo}>
                <Text style={[type.subheading, { color: colors.text }]}>{tr(book.title)}</Text>
                <Text style={[type.caption, { color: colors.textSecondary }]}>
                  {tr(book.author)} · {book.year}
                </Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>{t('libPages', { pages: book.pages })}</Text>
                <PrimaryButton
                  title={t('libRead')}
                  compact
                  arrow
                  onPress={() => openExternal(book.url, { title: t('linkErrorTitle'), text: t('linkErrorText', { url: book.url }) })}
                  style={styles.readButton}
                />
              </View>
            </GlassCard>
          ))}
        </>
      )}
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
  book: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  cover: {
    width: 86,
    height: 124,
    borderRadius: radius.sm,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  coverText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 15,
    color: '#FFFFFF',
  },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  readButton: {
    marginTop: spacing.sm,
  },
});
