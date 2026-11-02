import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { routeSegments } from '../utils/routeLine';
import type { RouteMapProps } from './RouteMap';

const VIEW_SIZE = 1000;
const PADDING = 60;

/**
 * Веб-версия: react-native-maps в браузере не работает, поэтому здесь схема
 * с теми же координатами линии и остановок, без подложки карты.
 * Metro автоматически выбирает этот файл для веба вместо RouteMap.tsx.
 */
export default function RouteMap({ route, vehicles, focusStop }: RouteMapProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const points = route ? [...route.line, ...route.stops.map((s): [number, number] => [s.lat, s.lon])] : [];
  const lats = points.map((p) => p[0]);
  const lons = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const span = Math.max(maxLat - minLat, maxLon - minLon) || 1;
  const scale = (VIEW_SIZE - PADDING * 2) / span;
  const x = (lon: number) => PADDING + (lon - minLon) * scale;
  const y = (lat: number) => PADDING + (maxLat - lat) * scale;

  return (
    <View style={styles.container}>
      <View style={[styles.map, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        {route && points.length > 0 ? (
          <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} style={{ width: '100%', height: '100%' }} role="img" aria-label={route.name}>
            {routeSegments(route.line).map((segment, index) => (
              <polyline key={index} points={segment.map(([lat, lon]) => `${x(lon)},${y(lat)}`).join(' ')} fill="none" stroke={colors.primary} strokeWidth={8} strokeLinejoin="round" />
            ))}
            {route.stops.map((stop, index) => {
              const focused = focusStop?.name === stop.name;
              return <circle key={index} cx={x(stop.lon)} cy={y(stop.lat)} r={focused ? 22 : 11} fill={focused ? colors.danger : colors.text} />;
            })}
            {vehicles.map((bus, index) => (
              <circle key={`bus-${index}`} cx={x(bus.lon)} cy={y(bus.lat)} r={20} fill={colors.success} />
            ))}
          </svg>
        ) : (
          <Text style={[type.body, styles.empty, { color: colors.textMuted }]}>{t('transportPickRoute')}</Text>
        )}
      </View>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('transportWebMap')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  map: {
    height: 300,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    padding: spacing.lg,
  },
});
