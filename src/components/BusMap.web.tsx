import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BUS_ROUTES, Coordinate } from '../data/buses';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { BusMapProps } from './BusMap';

/** Границы всех остановок — чтобы схема заполняла весь прямоугольник. */
const ALL_POINTS = BUS_ROUTES.flatMap((route) => route.stops.map((stop) => stop.coordinate));
const BOUNDS = {
  minLat: Math.min(...ALL_POINTS.map((p) => p.latitude)),
  maxLat: Math.max(...ALL_POINTS.map((p) => p.latitude)),
  minLng: Math.min(...ALL_POINTS.map((p) => p.longitude)),
  maxLng: Math.max(...ALL_POINTS.map((p) => p.longitude)),
};

/**
 * Веб-версия карты: react-native-maps в браузере не работает, поэтому здесь —
 * схема с теми же координатами (остановки и автобусы) без подложки карты.
 * Metro автоматически выбирает этот файл для веба вместо BusMap.tsx.
 */
export default function BusMap({ selectedRouteId, positions, onSelectRoute }: BusMapProps) {
  const { colors } = useTheme();
  const { t, tr } = useI18n();

  // Переводим широту/долготу в проценты внутри прямоугольника схемы (с отступом 8% по краям)
  const project = (point: Coordinate) => ({
    left: `${8 + ((point.longitude - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 84}%` as const,
    top: `${8 + ((BOUNDS.maxLat - point.latitude) / (BOUNDS.maxLat - BOUNDS.minLat)) * 84}%` as const,
  });

  return (
    <View style={styles.container}>
      <View style={[styles.map, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        {BUS_ROUTES.map((route) =>
          route.stops.map((stop) => (
            <Pressable
              key={`${route.id}-${stop.name.en}`}
              onPress={() => onSelectRoute(route.id)}
              accessibilityLabel={`${route.number}: ${tr(stop.name)}`}
              style={[
                styles.stop,
                project(stop.coordinate),
                { backgroundColor: route.color, opacity: route.id === selectedRouteId ? 1 : 0.35 },
              ]}
            />
          )),
        )}
        {positions.map((bus) => {
          const route = BUS_ROUTES.find((item) => item.id === bus.routeId);
          if (!route) return null;
          return (
            <View key={bus.id} style={[styles.bus, project(bus.coordinate), { backgroundColor: route.color }]}>
              <Text style={styles.busText}>{route.number}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('busMapWeb')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  map: {
    height: 320,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stop: {
    position: 'absolute',
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    borderRadius: 5,
  },
  bus: {
    position: 'absolute',
    minWidth: 26,
    height: 20,
    marginLeft: -13,
    marginTop: -10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
});
