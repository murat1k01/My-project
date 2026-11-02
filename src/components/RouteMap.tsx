import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Text } from './AppText';
import type { BusRoute, BusStop, Vehicle } from '../api/types';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/metrics';
import { fonts } from '../theme/typography';
import { routeSegments } from '../utils/routeLine';

export type RouteMapProps = {
  route: BusRoute | null;
  vehicles: Vehicle[];
  /** Показывать точку пользователя: только после разрешения на геолокацию */
  showUser: boolean;
  showTraffic: boolean;
  /** Остановка, к которой нужно приблизить карту */
  focusStop: BusStop | null;
};

const ALMATY_REGION = { latitude: 43.2389, longitude: 76.8897, latitudeDelta: 0.28, longitudeDelta: 0.28 };
const ROUTE_COLOR = '#2F6BFF';

/**
 * Карта на телефоне. Линия и остановки — из OpenStreetMap, слой пробок рисует картографический сервис устройства.
 * Автобусы показываются только если настоящий источник вернул их координаты.
 * Для браузера используется RouteMap.web.tsx, потому что react-native-maps в вебе не работает.
 */
export default function RouteMap({ route, vehicles, showUser, showTraffic, focusStop }: RouteMapProps) {
  const { isDark } = useTheme();
  const map = useRef<MapView>(null);

  useEffect(() => {
    if (focusStop) {
      map.current?.animateToRegion({ latitude: focusStop.lat, longitude: focusStop.lon, latitudeDelta: 0.012, longitudeDelta: 0.012 });
      return;
    }
    if (!route) return;
    const points = (route.line.length > 1 ? route.line : route.stops.map((s): [number, number] => [s.lat, s.lon])).map(([latitude, longitude]) => ({ latitude, longitude }));
    if (points.length > 1) map.current?.fitToCoordinates(points, { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true });
  }, [route, focusStop]);

  return (
    <View style={styles.wrap}>
      <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={ALMATY_REGION} showsUserLocation={showUser} showsTraffic={showTraffic} userInterfaceStyle={isDark ? 'dark' : 'light'} toolbarEnabled={false}>
        {route
          ? routeSegments(route.line).map((segment, index) => (
              <Polyline key={index} coordinates={segment.map(([latitude, longitude]) => ({ latitude, longitude }))} strokeColor={ROUTE_COLOR} strokeWidth={4} />
            ))
          : null}
        {route?.stops.map((stop, index) => (
          <Marker key={`${stop.name}-${index}`} coordinate={{ latitude: stop.lat, longitude: stop.lon }} title={stop.name} pinColor="#111111" tracksViewChanges={false} />
        ))}
        {vehicles.map((bus, index) => (
          <Marker key={`bus-${index}`} coordinate={{ latitude: bus.lat, longitude: bus.lon }} tracksViewChanges={false}>
            <View style={styles.bus}>
              <Text style={styles.busText}>{bus.routeNumber}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 300,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  bus: {
    minWidth: 28,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: ROUTE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
});
