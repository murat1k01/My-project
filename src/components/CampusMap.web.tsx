import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { useI18n } from '../i18n/LanguageContext';
import { brand } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/metrics';
import { type } from '../theme/typography';
import type { CampusMapProps } from './CampusMap';

const W = 1000;
const H = 640;
const PAD = 70;

/**
 * Веб-версия: react-native-maps в браузере не работает, поэтому это схема кампуса
 * по тем же координатам OpenStreetMap — здания и ближайшие остановки, без подложки карты.
 */
export default function CampusMap({ places, stops, selectedId, onSelect }: CampusMapProps) {
  const { colors } = useTheme();
  const { t, tr } = useI18n();
  const lats = [...places.map((p) => p.lat), ...stops.map((s) => s.lat)];
  const lons = [...places.map((p) => p.lon), ...stops.map((s) => s.lon)];
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  // Долгота на широте Алматы «короче» широты: учитываем, чтобы схема не была растянута
  const k = Math.cos((43.245 * Math.PI) / 180);
  const spanX = (maxLon - minLon) * k || 0.001;
  const spanY = maxLat - minLat || 0.001;
  const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
  const x = (lon: number) => PAD + (lon - minLon) * k * scale + ((W - PAD * 2) - spanX * scale) / 2;
  const y = (lat: number) => PAD + (maxLat - lat) * scale + ((H - PAD * 2) - spanY * scale) / 2;

  return (
    <View style={styles.container}>
      <View style={[styles.map, { backgroundColor: colors.surfaceAlt, borderColor: 'rgba(212, 183, 124, 0.5)' }]}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} role="img" aria-label={t('mapTitle')}>
          {/* Сетка-подложка */}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={(W / 8) * i} y1={0} x2={(W / 8) * i} y2={H} stroke={colors.border} strokeWidth={1} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke={colors.border} strokeWidth={1} />
          ))}
          {stops.map((stop) => (
            <g key={`${stop.name}-${stop.lat}`}>
              <circle cx={x(stop.lon)} cy={y(stop.lat)} r={9} fill="#438453" stroke="#FFFFFF" strokeWidth={3} />
              <text x={x(stop.lon) + 14} y={y(stop.lat) + 5} fontSize={18} fill={colors.textMuted}>
                {stop.name}
              </text>
            </g>
          ))}
          {/* Выбранное здание рисуется последним, чтобы его подпись была поверх остальных */}
          {[...places].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)).map((place) => {
            const selected = place.id === selectedId;
            const short = place.kind === 'main' ? 'ALT' : `№${place.id.replace(/\D/g, '')}`;
            return (
              <g key={place.id} onClick={() => onSelect(place.id)} style={{ cursor: 'pointer' }}>
                <circle cx={x(place.lon)} cy={y(place.lat)} r={selected ? 30 : 24} fill={brand.navy} stroke={brand.gold} strokeWidth={selected ? 6 : 4} />
                <text x={x(place.lon)} y={y(place.lat) + 7} fontSize={selected ? 20 : 17} fontWeight={700} textAnchor="middle" fill="#FFFFFF">
                  {short}
                </text>
                {selected ? (
                  <text x={x(place.lon)} y={y(place.lat) + 58} fontSize={24} fontWeight={700} textAnchor="middle" fill={colors.text} stroke={colors.surfaceAlt} strokeWidth={6} paintOrder="stroke">
                    {tr(place.name)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </View>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('mapWebNote')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  map: {
    width: '100%',
    aspectRatio: W / H,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
