import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import CampusMap, { NearStop } from '../components/CampusMap';
import { Text } from '../components/AppText';
import FormBanner from '../components/FormBanner';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import SegmentedTabs from '../components/SegmentedTabs';
import StateView from '../components/StateView';
import { CAMPUS_PLACES, distanceMeters, PLACE_ICON } from '../data/campus';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { brand } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { openTwoGis, twoGisPointUrl } from '../utils/twoGis';

type Tab = 'buildings' | 'stops';

const MAIN = CAMPUS_PLACES[0];

/**
 * «Кампус картасы»: настоящие здания ALT из OpenStreetMap (главный корпус и четыре общежития),
 * ближайшие к университету остановки, расстояние до вас (после разрешения) и маршрут в 2ГИС.
 */
export default function CampusMapScreen({ navigation }: RootStackScreenProps<'CampusMap'>) {
  const { colors, isDark } = useTheme();
  const { t, tr } = useI18n();
  const [tab, setTab] = useState<Tab>('buildings');
  const [selectedId, setSelectedId] = useState<string | null>(MAIN.id);
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const near = useApi<{ stops: NearStop[] }>(`/api/transport/near?lat=${MAIN.lat}&lon=${MAIN.lon}&radius=700`);
  const stops = near.data?.stops ?? [];
  const selected = CAMPUS_PLACES.find((p) => p.id === selectedId) ?? MAIN;

  const locate = async () => {
    setLocError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError(t('mapNoPermission'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setMe({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      setLocError(t('mapNoLocation'));
    } finally {
      setLocating(false);
    }
  };

  const meters = (lat: number, lon: number) => (me ? distanceMeters(me.lat, me.lon, lat, lon) : distanceMeters(MAIN.lat, MAIN.lon, lat, lon));
  const formatDistance = (m: number) => (m >= 1000 ? t('mapKm', { km: (m / 1000).toFixed(1) }) : t('mapM', { m }));

  return (
    <ScreenScroll title={t('mapTitle')} onBack={navigation.goBack}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'buildings', label: t('mapBuildings') },
          { value: 'stops', label: t('mapStops') },
        ]}
        value={tab}
        onChange={setTab}
      />

      <CampusMap places={CAMPUS_PLACES} stops={stops} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setTab('buildings'); }} showUser={me !== null} />

      {/* Карточка выбранного здания */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gold }]}>
        <View style={styles.cardHead}>
          <View style={styles.pin}>
            <Ionicons name={PLACE_ICON[selected.kind]} size={22} color="#FFFFFF" />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.placeName, { color: colors.text }]}>{tr(selected.name)}</Text>
            <View style={styles.meta}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[type.caption, { color: colors.textSecondary }]}>{selected.address}</Text>
              {selected.id !== MAIN.id || me ? <Text style={[type.caption, { color: colors.textSecondary }]}>· {formatDistance(meters(selected.lat, selected.lon))}{me ? '' : ` ${t('mapFromMain')}`}</Text> : null}
            </View>
          </View>
          <Pressable onPress={() => void openTwoGis(twoGisPointUrl(selected.lat, selected.lon))} accessibilityRole="link" accessibilityLabel={t('mapRoute')} style={({ pressed }) => [styles.route, pressed && styles.pressed]}>
            <Ionicons name="navigate" size={20} color={brand.ivory} />
          </Pressable>
        </View>
        <Text style={[type.body, { color: colors.textSecondary }]}>{tr(selected.note)}</Text>
      </View>

      <PrimaryButton title={me ? t('mapLocated') : t('mapLocate')} icon="locate-outline" variant="glass" loading={locating} onPress={() => void locate()} />
      {locError ? <FormBanner text={locError} /> : null}

      {tab === 'buildings' ? (
        <View style={styles.list}>
          {CAMPUS_PLACES.map((place) => {
            const active = place.id === selectedId;
            return (
              <Pressable
                key={place.id}
                onPress={() => setSelectedId(place.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: active ? colors.gold : colors.border }, pressed && styles.pressed]}
              >
                <View style={[styles.icon, { backgroundColor: colors.primarySoft, borderColor: colors.gold }]}>
                  <Ionicons name={PLACE_ICON[place.kind]} size={18} color={isDark ? colors.gold : colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{tr(place.name)}</Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{place.address}</Text>
                </View>
                <Text style={[type.caption, { color: colors.textMuted }]}>{place.id === MAIN.id && !me ? '' : formatDistance(meters(place.lat, place.lon))}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <StateView loading={near.loading} error={near.error} hasData={near.data !== null} empty={stops.length === 0} emptyIcon="bus-outline" emptyTitle={t('mapNoStops')} onRetry={() => void near.reload()}>
          <View style={styles.list}>
            <Text style={[type.caption, { color: colors.textSecondary }]}>{t('mapStopsHint')}</Text>
            {stops.map((stop) => (
              <Pressable
                key={`${stop.name}-${stop.lat}`}
                onPress={() => void openTwoGis(twoGisPointUrl(stop.lat, stop.lon))}
                accessibilityRole="link"
                style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
              >
                <View style={[styles.icon, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
                  <Ionicons name="bus-outline" size={18} color={colors.success} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{stop.name}</Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={2}>
                    {t('mapBuses')}: {stop.routes.map((r) => r.number).join(', ')}
                  </Text>
                </View>
                <Text style={[type.caption, { color: colors.textMuted }]}>{formatDistance(stop.meters)}</Text>
              </Pressable>
            ))}
            <PrimaryButton title={t('gridTransport')} icon="bus-outline" variant="glass" onPress={() => navigation.navigate('Transport')} />
          </View>
        </StateView>
      )}
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('mapSource')}</Text>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pin: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: brand.navy,
    borderWidth: 2,
    borderColor: brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeName: {
    fontFamily: fonts.card,
    fontSize: 17,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  route: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brand.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: fonts.card,
    fontSize: 15,
  },
});
