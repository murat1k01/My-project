import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import ScreenScroll from '../components/ScreenScroll';
import ServiceCard from '../components/ServiceCard';
import { useAppData } from '../context/AppDataContext';
import { SERVICES } from '../data/services';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { SCREEN_PADDING, spacing } from '../theme/metrics';
import type { Service } from '../types/Service';

type Filter = 'all' | 'favorites';

const GRID_GAP = spacing.sm + 2;
const LIST = SERVICES.filter((service) => !service.hidden);

/** «Барлық қызметтер»: все сервисы плитками, с фильтром «Избранное». */
export default function AllServicesScreen({ navigation }: RootStackScreenProps<'AllServices'>) {
  const { t } = useI18n();
  const { favorites, isFavorite, toggleFavorite } = useAppData();
  const [filter, setFilter] = useState<Filter>('all');
  const { width } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const columns = width >= 600 ? 4 : 3;
  const available = gridWidth || Math.min(width, 760) - SCREEN_PADDING * 2;
  const cardWidth = Math.floor((available - GRID_GAP * (columns - 1)) / columns);
  const visible = filter === 'favorites' ? LIST.filter((service) => isFavorite(service.id)) : LIST;

  const open = (service: Service) => {
    if (service.route) navigation.navigate(service.route);
    else navigation.navigate('ServiceDetails', { serviceId: service.id });
  };

  return (
    <ScreenScroll title={t('gridAll')} onBack={navigation.goBack}>
      <View style={styles.chips}>
        <Chip label={`${t('filterAll')} ${LIST.length}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={`${t('filterFavorites')} ${favorites.filter((id) => LIST.some((s) => s.id === id)).length}`} icon="star" selected={filter === 'favorites'} onPress={() => setFilter('favorites')} />
      </View>
      {visible.length > 0 ? (
        <View style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
          {visible.map((service) => (
            <ServiceCard key={service.id} service={service} width={cardWidth} isFavorite={isFavorite(service.id)} onPress={() => open(service)} onToggleFavorite={() => toggleFavorite(service.id)} />
          ))}
        </View>
      ) : (
        <EmptyState icon="star-outline" title={t('emptyFavTitle')} message={t('emptyFavText')} actionLabel={t('showAll')} onAction={() => setFilter('all')} />
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
});
