import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import SearchField from '../components/SearchField';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import { openExternal } from '../utils/links';
import { ALT_ADDRESS, twoGisSearchUrl } from '../utils/twoGis';

export type CampusPlace = {
  id: string;
  name: string;
  kind: string;
  building: string | null;
  floor: number;
  room: string | null;
  note: string | null;
  source: string | null;
  verified: boolean;
};

/** Этажей в главном корпусе (по карточке здания в 2ГИС) */
const FLOORS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const KIND_ICONS: Record<string, IoniconName> = {
  hall: 'mic-outline',
  museum: 'business-outline',
  office: 'briefcase-outline',
  canteen: 'restaurant-outline',
  library: 'library-outline',
  room: 'school-outline',
  sport: 'barbell-outline',
  wc: 'water-outline',
};
const KIND_LABELS: Record<string, TranslationKey> = {
  hall: 'planKindHall',
  museum: 'planKindMuseum',
  office: 'planKindOffice',
  canteen: 'planKindCanteen',
  library: 'planKindLibrary',
  room: 'planKindRoom',
  sport: 'planKindSport',
};

const normalize = (value: string) => value.toLowerCase().replace(/[\s-]/g, '').replace(/в/g, 'b');

/** План главного корпуса ALT: этажи и места на них, поиск аудитории, ссылка на 2ГИС. */
export default function CampusPlanScreen({ navigation }: RootStackScreenProps<'CampusPlan'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data, loading, error, reload } = useApi<{ places: CampusPlace[]; address: string }>('/api/campus/places');
  const [floor, setFloor] = useState(1);
  const [query, setQuery] = useState('');
  const places = useMemo(() => data?.places ?? [], [data]);

  const search = query.trim();
  const found = useMemo(() => {
    if (!search) return [];
    const needle = normalize(search);
    return places.filter((p) => normalize(`${p.name} ${p.room ?? ''} ${p.note ?? ''}`).includes(needle));
  }, [places, search]);
  const onFloor = places.filter((p) => p.floor === floor);
  const usedFloors = new Set(places.map((p) => p.floor));

  const openMap = () => {
    const url = twoGisSearchUrl(data?.address ?? ALT_ADDRESS);
    void openExternal(url, { title: t('linkErrorTitle'), text: t('linkErrorText', { url }) });
  };

  return (
    <ScreenScroll title={t('planTitle')} subtitle={t('planSubtitle')} onBack={navigation.goBack}>
      <GlassCard style={styles.addressCard}>
        <Ionicons name="location" size={24} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={[type.subheading, { color: colors.text }]}>{t('planBuilding')}</Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>{data?.address ?? ALT_ADDRESS}</Text>
        </View>
        <PrimaryButton title={t('twoGisOpen')} compact icon="map-outline" variant="glass" onPress={openMap} />
      </GlassCard>

      <SearchField value={query} onChangeText={setQuery} placeholder={t('planSearch')} />

      <StateView loading={loading} error={error} hasData={data !== null} onRetry={() => void reload()}>
        {search ? (
          <View style={styles.list}>
            {found.length === 0 ? <Text style={[type.body, { color: colors.textSecondary }]}>{t('planNotFound')}</Text> : null}
            {found.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                onShowFloor={() => {
                  setFloor(place.floor);
                  setQuery('');
                }}
              />
            ))}
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.floors}>
              {FLOORS.map((value) => (
                <Chip key={value} label={`${value} ${t('planFloorShort')}${usedFloors.has(value) ? ' •' : ''}`} selected={floor === value} onPress={() => setFloor(value)} />
              ))}
            </ScrollView>

            <FloorScheme floor={floor} places={onFloor} />

            <View style={styles.list}>
              {onFloor.map((place) => (
                <PlaceRow key={place.id} place={place} />
              ))}
              {onFloor.length === 0 ? <Text style={[type.body, { color: colors.textSecondary }]}>{t('planFloorEmpty')}</Text> : null}
            </View>
          </>
        )}
      </StateView>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('planNote')}</Text>
    </ScreenScroll>
  );
}

/** Схема этажа: коридор посередине, места по обе стороны. Расположение условное: показывает, что есть на этаже. */
function FloorScheme({ floor, places }: { floor: number; places: CampusPlace[] }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const top = places.filter((_, index) => index % 2 === 0);
  const bottom = places.filter((_, index) => index % 2 === 1);
  const row = (items: CampusPlace[]) => (
    <View style={styles.schemeRow}>
      {items.length === 0 ? <View style={[styles.room, styles.roomEmpty, { borderColor: colors.border }]} /> : null}
      {items.map((place) => (
        <View key={place.id} style={[styles.room, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
          <Ionicons name={KIND_ICONS[place.kind] ?? 'location-outline'} size={18} color={colors.primary} />
          <Text style={[styles.roomText, { color: colors.text }]} numberOfLines={2}>
            {place.room ? `${place.room} · ` : ''}
            {place.name}
          </Text>
        </View>
      ))}
    </View>
  );
  return (
    <GlassCard style={styles.scheme} animated={false}>
      <Text style={[type.label, { color: colors.textMuted }]}>{t('planFloorTitle', { floor })}</Text>
      {row(top)}
      <View style={[styles.corridor, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name="walk-outline" size={16} color={colors.textMuted} />
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('planCorridor')}</Text>
      </View>
      {row(bottom)}
    </GlassCard>
  );
}

function PlaceRow({ place, onShowFloor }: { place: CampusPlace; onShowFloor?: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const kind = KIND_LABELS[place.kind];
  return (
    <GlassCard style={styles.placeRow}>
      <View style={[styles.placeIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={KIND_ICONS[place.kind] ?? 'location-outline'} size={20} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={[type.subheading, { color: colors.text }]}>{place.name}</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          {t('planFloorTitle', { floor: place.floor })}
          {place.room ? ` · ${t('planRoom', { room: place.room })}` : ''}
          {kind ? ` · ${t(kind)}` : ''}
        </Text>
        {place.note ? <Text style={[type.caption, { color: colors.textMuted }]}>{place.note}</Text> : null}
        <Text style={[type.caption, { color: place.verified ? colors.success : colors.textMuted }]}>{place.verified ? t('planVerified') : t('planUnverified')}</Text>
      </View>
      {onShowFloor ? <PrimaryButton title={t('planShowFloor')} compact variant="glass" onPress={onShowFloor} /> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  floors: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  list: {
    gap: spacing.md,
  },
  scheme: {
    gap: spacing.sm,
  },
  schemeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  room: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 4,
    justifyContent: 'center',
  },
  roomEmpty: {
    borderStyle: 'dashed',
  },
  roomText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  corridor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 34,
    borderRadius: radius.sm,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  placeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
