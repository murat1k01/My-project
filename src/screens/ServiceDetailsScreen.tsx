import { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';
import { getServiceById } from '../data/services';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { SCREEN_PADDING, spacing } from '../theme/metrics';
import type { ServiceId } from '../types/Service';
import DormService from './services/DormService';
import FoodService from './services/FoodService';
import LibraryService from './services/LibraryService';
import LmsService from './services/LmsService';
import ScheduleService from './services/ScheduleService';
import SportService from './services/SportService';
import type { ServiceScreenProps } from './services/types';

/** Сервисы, которые открываются в общем макете. Остальные разделы имеют собственные экраны. */
const SERVICE_SCREENS: Partial<Record<ServiceId, ComponentType<ServiceScreenProps>>> = {
  cal: ScheduleService,
  lib: LibraryService,
  lms: LmsService,
  food: FoodService,
  sport: SportService,
  dorm: DormService,
};

export default function ServiceDetailsScreen({ navigation, route }: RootStackScreenProps<'ServiceDetails'>) {
  const { t } = useI18n();
  const service = getServiceById(route.params.serviceId);
  const Screen = service ? SERVICE_SCREENS[service.id] : undefined;

  if (!service || !Screen) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.padded}>
          <TopBar onBack={navigation.goBack} />
          <EmptyState icon="help-circle-outline" title={t('errorTitle')} message={t('notSpecified')} actionLabel={t('back')} onAction={navigation.goBack} />
        </View>
      </ScreenContainer>
    );
  }

  return <Screen service={service} onBack={navigation.goBack} initialTab={route.params.tab} openScreen={(screen) => navigation.navigate(screen)} />;
}

const styles = StyleSheet.create({
  padded: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.lg,
  },
});
