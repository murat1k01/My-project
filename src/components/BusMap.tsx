import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ALMATY_REGION, BUS_ROUTES, BusPosition } from '../data/buses';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/metrics';
import { fonts } from '../theme/typography';

export type BusMapProps = {
  selectedRouteId: string;
  positions: BusPosition[];
  showTraffic: boolean;
  onSelectRoute: (routeId: string) => void;
};

/**
 * Карта Алматы (телефон): линии маршрутов, остановки и автобусы.
 * Слой пробок (showsTraffic) рисует картографический сервис устройства — это реальные данные провайдера карты.
 * Положение автобусов — демо-расчёт по расписанию (см. getBusPositions).
 * Для браузера используется BusMap.web.tsx, потому что react-native-maps в вебе не работает.
 */
export default function BusMap({ selectedRouteId, positions, showTraffic, onSelectRoute }: BusMapProps) {
  const { isDark } = useTheme();
  const { tr, t } = useI18n();

  return (
    <View style={styles.wrap}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={ALMATY_REGION}
        showsTraffic={showTraffic}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        toolbarEnabled={false}
      >
        {BUS_ROUTES.map((route) => {
          const selected = route.id === selectedRouteId;
          return (
            <Polyline
              key={route.id}
              coordinates={route.stops.map((stop) => stop.coordinate)}
              strokeColor={selected ? route.color : `${route.color}66`}
              strokeWidth={selected ? 5 : 3}
              tappable
              onPress={() => onSelectRoute(route.id)}
            />
          );
        })}

        {BUS_ROUTES.find((route) => route.id === selectedRouteId)?.stops.map((stop) => (
          <Marker key={stop.name.en} coordinate={stop.coordinate} title={tr(stop.name)} pinColor="#111111" />
        ))}

        {positions.map((bus) => {
          const route = BUS_ROUTES.find((item) => item.id === bus.routeId);
          if (!route) return null;
          return (
            <Marker
              key={bus.id}
              coordinate={bus.coordinate}
              title={t('busBusLabel', { number: route.number })}
              description={tr(route.name)}
              onPress={() => onSelectRoute(route.id)}
              tracksViewChanges={false}
            >
              <View style={[styles.bus, { backgroundColor: route.color }]}>
                <Text style={styles.busText}>{route.number}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 320,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  busText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
});
