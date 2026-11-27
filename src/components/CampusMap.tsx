import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { CampusPlace, PLACE_ICON } from '../data/campus';
import { brand } from '../theme/brand';
import { radius } from '../theme/metrics';

export type NearStop = { name: string; lat: number; lon: number; meters: number; routes: { id: string; number: string }[] };

export type CampusMapProps = {
  places: CampusPlace[];
  stops: NearStop[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showUser: boolean;
};

const CAMPUS_REGION = { latitude: 43.2447, longitude: 76.9328, latitudeDelta: 0.012, longitudeDelta: 0.012 };

/**
 * Карта кампуса на телефоне: тёмно-синие маркеры зданий с золотой обводкой, остановки — маленькие точки.
 * В браузере используется CampusMap.web.tsx.
 */
export default function CampusMap({ places, stops, selectedId, onSelect, showUser }: CampusMapProps) {
  const map = useRef<MapView>(null);

  // Плавно перелетаем к выбранному зданию
  useEffect(() => {
    const place = places.find((p) => p.id === selectedId);
    if (place) map.current?.animateToRegion({ latitude: place.lat, longitude: place.lon, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 600);
  }, [selectedId, places]);

  return (
    <View style={styles.wrap}>
      <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={CAMPUS_REGION} showsUserLocation={showUser} toolbarEnabled={false}>
        {stops.map((stop) => (
          <Marker key={`${stop.name}-${stop.lat}`} coordinate={{ latitude: stop.lat, longitude: stop.lon }} title={stop.name} description={stop.routes.map((r) => r.number).join(', ')}>
            <View style={styles.stop}>
              <Ionicons name="bus" size={10} color="#FFFFFF" />
            </View>
          </Marker>
        ))}
        {places.map((place) => {
          const selected = place.id === selectedId;
          return (
            <Marker key={place.id} coordinate={{ latitude: place.lat, longitude: place.lon }} onPress={() => onSelect(place.id)} zIndex={selected ? 10 : 1}>
              <View style={[styles.marker, selected && styles.markerSelected]}>
                <Ionicons name={PLACE_ICON[place.kind]} size={selected ? 20 : 16} color="#FFFFFF" />
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
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.5)',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand.navy,
    borderWidth: 2,
    borderColor: brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
  },
  stop: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#438453',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
