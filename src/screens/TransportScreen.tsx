import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { BusRoute, BusRouteSummary, BusStop, FoundStop, Vehicle } from '../api/types';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import FormBanner from '../components/FormBanner';
import GlassCard from '../components/GlassCard';
import IconButton from '../components/IconButton';
import PrimaryButton from '../components/PrimaryButton';
import RouteMap from '../components/RouteMap';
import ScreenScroll from '../components/ScreenScroll';
import SearchField from '../components/SearchField';
import SegmentedTabs from '../components/SegmentedTabs';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useFavorites } from '../hooks/useFavorites';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { formatDate, formatDateTime } from '../utils/format';
import { openExternal } from '../utils/links';

type Tab = 'routes' | 'stops' | 'saved';

const VEHICLES_REFRESH_MS = 20_000;

type RoutesResponse = { routes: BusRouteSummary[]; source: string; updatedAt: string };
type VehiclesResponse = { available: boolean; vehicles: Vehicle[]; reason?: string; updatedAt?: string };

/** Almaty Bus: настоящие маршруты из OpenStreetMap. Движение автобусов показывается только при подключённом источнике. */
export default function TransportScreen({ navigation }: RootStackScreenProps<'Transport'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const [tab, setTab] = useState<Tab>('routes');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusStop, setFocusStop] = useState<BusStop | null>(null);
  const [showUser, setShowUser] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const search = useDebounced(query.trim());

  const favoriteRoutes = useFavorites('route');
  const favoriteStops = useFavorites('stop');

  const routes = useApi<RoutesResponse>(`/api/transport/routes${tab === 'routes' && search ? `?q=${encodeURIComponent(search)}` : ''}`);
  const stops = useApi<{ stops: FoundStop[] }>(tab === 'stops' && search.length >= 2 ? `/api/transport/stops?q=${encodeURIComponent(search)}` : null);
  const detail = useApi<{ route: BusRoute; source: string; updatedAt: string }>(selectedId ? `/api/transport/routes/${encodeURIComponent(selectedId)}` : null);
  const route = selectedId && detail.data?.route.id === selectedId ? detail.data.route : null;

  const vehicles = useApi<VehiclesResponse>(route ? `/api/transport/vehicles?route=${encodeURIComponent(route.number)}` : null);
  const liveAvailable = route !== null && vehicles.data?.available === true;
  const reloadVehicles = vehicles.reload;

  // Обновляем положение автобусов, только если настоящий источник подключён
  useEffect(() => {
    if (!liveAvailable) return;
    const timer = setInterval(() => void reloadVehicles(), VEHICLES_REFRESH_MS);
    return () => clearInterval(timer);
  }, [liveAvailable, reloadVehicles]);

  const selectRoute = (id: string) => {
    setSelectedId(id);
    setFocusStop(null);
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  const showStopOnMap = (stop: BusStop) => {
    setFocusStop(stop);
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  const openDirections = (stop: BusStop) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lon}&travelmode=transit`;
    void openExternal(url, { title: t('linkErrorTitle'), text: t('linkErrorText', { url }) });
  };

  const requestLocation = async () => {
    setLocationNote(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') setShowUser(true);
      else setLocationNote(t('locationDenied'));
    } catch {
      setLocationNote(t('locationError'));
    }
  };

  const savedRoutes = (routes.data?.routes ?? []).filter((item) => favoriteRoutes.isFavorite(item.id));

  const routeRow = (item: BusRouteSummary) => (
    <RouteRow key={item.id} route={item} selected={item.id === selectedId} favorite={favoriteRoutes.isFavorite(item.id)} onPress={() => selectRoute(item.id)} onToggleFavorite={() => void favoriteRoutes.toggle(item.id)} />
  );

  return (
    <ScreenScroll title={t('transportTitle')} subtitle={t('transportSubtitle')} onBack={navigation.goBack} scrollRef={scroll}>
      <RouteMap route={route} vehicles={liveAvailable ? (vehicles.data?.vehicles ?? []) : []} showUser={showUser} showTraffic={showTraffic} focusStop={focusStop} />

      {Platform.OS !== 'web' ? (
        <View style={styles.mapActions}>
          <Chip label={t('locationShow')} icon="locate-outline" selected={showUser} onPress={() => void requestLocation()} />
          <Chip label={t('busTraffic')} icon="car-outline" selected={showTraffic} onPress={() => setShowTraffic((prev) => !prev)} />
        </View>
      ) : null}
      {locationNote ? <FormBanner kind="info" text={locationNote} /> : null}

      {selectedId && !route ? (
        <StateView loading={detail.loading} error={detail.error} hasData={false} onRetry={() => void detail.reload()}>
          {null}
        </StateView>
      ) : null}

      {route ? (
        <GlassCard>
          <View style={styles.detailHeader}>
            <View style={[styles.number, { backgroundColor: colors.primary }]}>
              <Text style={[styles.numberText, { color: colors.onPrimary }]}>{route.number}</Text>
            </View>
            <Text style={[type.subheading, styles.flex, { color: colors.text }]}>{route.from && route.to ? `${route.from} → ${route.to}` : route.name}</Text>
            <IconButton icon="close" variant="glass" accessibilityLabel={t('close')} onPress={() => setSelectedId(null)} />
          </View>
          {route.operator ? <Fact label={t('transportOperator')} value={route.operator} /> : null}
          {route.hours ? <Fact label={t('transportHours')} value={route.hours} /> : null}
          {route.interval ? <Fact label={t('busInterval')} value={route.interval} /> : null}
          {route.lengthKm ? <Fact label={t('transportLength')} value={t('transportKm', { km: route.lengthKm })} /> : null}
          <FormBanner kind="info" text={liveAvailable ? t('transportLive', { time: vehicles.data?.updatedAt ? formatDateTime(vehicles.data.updatedAt, language) : '—' }) : t('transportNoLive')} />

          <Text style={[type.subheading, { color: colors.text }]}>{t('busStops')}</Text>
          {route.stops.length === 0 ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('transportNoStops')}</Text> : null}
          {route.stops.map((stop, index) => (
            <StopRow key={`${stop.name}-${index}`} stop={stop} favorite={favoriteStops.isFavorite(stop.name)} onShow={() => showStopOnMap(stop)} onDirections={() => openDirections(stop)} onToggleFavorite={() => void favoriteStops.toggle(stop.name)} />
          ))}
        </GlassCard>
      ) : null}

      <SegmentedTabs<Tab>
        options={[
          { value: 'routes', label: t('transportRoutes') },
          { value: 'stops', label: t('busStops') },
          { value: 'saved', label: t('filterFavorites') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab !== 'saved' ? <SearchField value={query} onChangeText={setQuery} placeholder={tab === 'routes' ? t('transportSearchRoute') : t('transportSearchStop')} /> : null}

      {tab === 'routes' ? (
        <StateView
          loading={routes.loading}
          error={routes.error}
          hasData={routes.data !== null}
          empty={routes.data?.routes.length === 0}
          emptyIcon="search-outline"
          emptyTitle={t('noResultsTitle')}
          emptyText={t('transportNoResults')}
          onRetry={() => void routes.reload()}
        >
          {routes.data?.routes.map(routeRow)}
        </StateView>
      ) : null}

      {tab === 'stops' ? (
        search.length < 2 ? (
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('transportStopHint')}</Text>
        ) : (
          <StateView
            loading={stops.loading}
            error={stops.error}
            hasData={stops.data !== null}
            empty={stops.data?.stops.length === 0}
            emptyIcon="search-outline"
            emptyTitle={t('noResultsTitle')}
            emptyText={t('transportNoResults')}
            onRetry={() => void stops.reload()}
          >
            {stops.data?.stops.map((stop) => (
              <GlassCard key={stop.name}>
                <StopRow stop={stop} favorite={favoriteStops.isFavorite(stop.name)} onDirections={() => openDirections(stop)} onToggleFavorite={() => void favoriteStops.toggle(stop.name)} />
                <View style={styles.stopRoutes}>
                  {stop.routes.map((item) => (
                    <Chip key={item.id} label={item.number} icon="bus-outline" selected={item.id === selectedId} onPress={() => selectRoute(item.id)} />
                  ))}
                </View>
              </GlassCard>
            ))}
          </StateView>
        )
      ) : null}

      {tab === 'saved' ? (
        savedRoutes.length === 0 && favoriteStops.items.length === 0 ? (
          <EmptyState icon="star-outline" title={t('transportSavedEmpty')} message={t('transportSavedHint')} />
        ) : (
          <>
            {savedRoutes.map(routeRow)}
            {favoriteStops.items.map((name) => (
              <Pressable
                key={name}
                onPress={() => {
                  setQuery(name);
                  setTab('stops');
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.savedStop, { backgroundColor: colors.glass, borderColor: colors.border }, pressed && styles.pressed]}
              >
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[type.bodyMedium, styles.flex, { color: colors.text }]}>{name}</Text>
              </Pressable>
            ))}
          </>
        )
      ) : null}

      {routes.data ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('transportSource', { source: routes.data.source, date: formatDate(routes.data.updatedAt, language) })}</Text> : null}
    </ScreenScroll>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[type.body, styles.flex, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

type RouteRowProps = {
  route: BusRouteSummary;
  selected: boolean;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

function RouteRow({ route, selected, favorite, onPress, onToggleFavorite }: RouteRowProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={[styles.routeRow, { backgroundColor: colors.glass, borderColor: selected ? colors.primary : colors.border }]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={t('busRoute', { number: route.number })} style={({ pressed }) => [styles.routeMain, pressed && styles.pressed]}>
        <View style={[styles.number, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.numberText, { color: colors.text }]}>{route.number}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={2}>
            {route.from && route.to ? `${route.from} → ${route.to}` : route.name}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>{route.stopCount > 0 ? t('transportStopsCount', { count: route.stopCount }) : t('transportNoStopsShort')}</Text>
        </View>
      </Pressable>
      <Star favorite={favorite} name={route.number} onPress={onToggleFavorite} />
    </View>
  );
}

type StopRowProps = {
  stop: BusStop;
  favorite: boolean;
  onShow?: () => void;
  onDirections: () => void;
  onToggleFavorite: () => void;
};

function StopRow({ stop, favorite, onShow, onDirections, onToggleFavorite }: StopRowProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.stopRow}>
      <Pressable onPress={onShow} disabled={!onShow} accessibilityRole={onShow ? 'button' : undefined} style={styles.stopName}>
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <Text style={[type.body, styles.flex, { color: colors.text }]}>{stop.name}</Text>
      </Pressable>
      <PrimaryButton title={t('transportDirections')} variant="glass" compact icon="navigate-outline" onPress={onDirections} />
      <Star favorite={favorite} name={stop.name} onPress={onToggleFavorite} />
    </View>
  );
}

function Star({ favorite, name, onPress }: { favorite: boolean; name: string; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={styles.star}
      accessibilityRole="button"
      accessibilityLabel={favorite ? t('removeFavoriteA11y', { name }) : t('addFavoriteA11y', { name })}
      accessibilityState={{ selected: favorite }}
    >
      <Ionicons name={favorite ? 'star' : 'star-outline'} size={22} color={favorite ? colors.warning : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  mapActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  number: {
    minWidth: 46,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  fact: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  routeMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  stopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stopName: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stopRoutes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  savedStop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  star: {
    padding: spacing.xs,
  },
});
