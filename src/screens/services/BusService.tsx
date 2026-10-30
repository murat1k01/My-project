import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import SectionHeader from '../../components/SectionHeader';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { BUS_ROUTES, getNextDepartures, getRoute } from '../../data/buses';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { withAlpha } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { formatTenge, fromMinutes, minutesOfDay } from '../../utils/format';
import type { ServiceScreenProps } from './types';

/** BUS — выбор маршрута, ближайшие отправления и остановки. Выбранный маршрут виден на главной. */
export default function BusService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow();
  const [selectedId, setSelectedId] = useState(campus.myRouteId ?? BUS_ROUTES[0].id);

  const route = getRoute(selectedId) ?? BUS_ROUTES[0];
  const departures = getNextDepartures(route, now, 5);
  const isMine = campus.myRouteId === route.id;
  const nowMinutes = minutesOfDay(now);

  const infoTiles = [
    { label: t('busInterval'), value: `${route.intervalMin} ${t('minutesShort')}` },
    { label: t('busTravel'), value: `${route.travelMin} ${t('minutesShort')}` },
    { label: t('busFare'), value: route.fare === 0 ? t('busFree') : formatTenge(route.fare) },
  ];

  return (
    <ServiceLayout service={service} onBack={onBack}>
      <SectionHeader title={t('busChoose')} />
      <View style={styles.routes}>
        {BUS_ROUTES.map((item) => {
          const active = item.id === route.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setSelectedId(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${t('busRoute', { number: item.number })}. ${tr(item.name)}`}
              style={[
                styles.routeChip,
                { backgroundColor: active ? withAlpha(item.color, 0.22) : colors.glass, borderColor: active ? item.color : colors.border },
              ]}
            >
              <View style={[styles.routeNumber, { backgroundColor: item.color }]}>
                <Text style={styles.routeNumberText}>{item.number}</Text>
              </View>
              {campus.myRouteId === item.id ? <Text style={styles.star}>★</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <GlassCard>
        <View style={styles.routeHeader}>
          <View style={[styles.bigNumber, { backgroundColor: route.color }]}>
            <Text style={styles.bigNumberText}>{route.number}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={[type.heading, { color: colors.text }]}>{tr(route.name)}</Text>
            <Text style={[type.caption, { color: colors.textSecondary }]}>{t('busHours', { from: route.first, to: route.last })}</Text>
          </View>
        </View>
        <View style={styles.tiles}>
          {infoTiles.map((tile) => (
            <View key={tile.label} style={[styles.tile, { backgroundColor: colors.glass, borderColor: colors.border }]}>
              <Text style={[type.caption, { color: colors.textMuted }]}>{tile.label}</Text>
              <Text style={[type.subheading, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {tile.value}
              </Text>
            </View>
          ))}
        </View>
        <PrimaryButton
          title={isMine ? t('busIsMine') : t('busSetMine')}
          icon={isMine ? 'checkmark-circle' : 'star-outline'}
          variant={isMine ? 'glass' : 'light'}
          arrow={!isMine}
          onPress={() => updateCampus((prev) => ({ ...prev, myRouteId: isMine ? null : route.id }))}
        />
      </GlassCard>

      <SectionHeader title={t('busNextDepartures')} />
      {departures.length > 0 ? (
        <View style={styles.departures}>
          {departures.map((time, index) => (
            <View
              key={time}
              style={[
                styles.departure,
                index === 0 ? { backgroundColor: route.color, borderColor: route.color } : { backgroundColor: colors.glass, borderColor: colors.border },
              ]}
            >
              <Text style={[type.subheading, { color: index === 0 ? '#FFFFFF' : colors.text }]}>{fromMinutes(time)}</Text>
              <Text style={[type.caption, { color: index === 0 ? 'rgba(255,255,255,0.85)' : colors.textMuted }]}>
                {t('busIn', { min: time - nowMinutes })}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <GlassCard>
          <Text style={[type.body, { color: colors.textSecondary }]}>{t('busNoMore', { time: route.first })}</Text>
        </GlassCard>
      )}

      <SectionHeader title={t('busStops')} />
      <GlassCard style={styles.stops}>
        {route.stops.map((stop, index) => {
          const last = index === route.stops.length - 1;
          const offset = Math.round((route.travelMin * index) / (route.stops.length - 1));
          return (
            <View key={stop.en} style={styles.stopRow}>
              <View style={styles.timeline}>
                <View style={[styles.dot, { borderColor: route.color, backgroundColor: last || index === 0 ? route.color : colors.background }]} />
                {!last ? <View style={[styles.line, { backgroundColor: withAlpha(route.color, 0.5) }]} /> : null}
              </View>
              <Text style={[type.body, styles.flex, { color: colors.text }]}>{tr(stop)}</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>+{offset} {t('minutesShort')}</Text>
            </View>
          );
        })}
      </GlassCard>
    </ServiceLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  routes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    paddingRight: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  routeNumber: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeNumberText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  star: {
    color: '#FBBF24',
    fontSize: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bigNumber: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumberText: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: '#FFFFFF',
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  departures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  departure: {
    minWidth: 96,
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  stops: {
    gap: 0,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: 46,
  },
  timeline: {
    width: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    marginTop: 3,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 2,
  },
});
