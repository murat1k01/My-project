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
import BusService from './services/BusService';
import DormService from './services/DormService';
import FoodService from './services/FoodService';
import InfoService from './services/InfoService';
import LibraryService from './services/LibraryService';
import LmsService from './services/LmsService';
import ScheduleService from './services/ScheduleService';
import SportService from './services/SportService';
import type { ServiceScreenProps } from './services/types';

/** Каждому сервису — свой рабочий экран. */
const SERVICE_SCREENS: Record<ServiceId, ComponentType<ServiceScreenProps>> = {
  cal: ScheduleService,
  bus: BusService,
  lib: LibraryService,
  lms: LmsService,
  food: FoodService,
  sport: SportService,
  dorm: DormService,
  info: InfoService,
};

export default function ServiceDetailsScreen({ navigation, route }: RootStackScreenProps<'ServiceDetails'>) {
  const { t } = useI18n();
  const service = getServiceById(route.params.serviceId);

  if (!service) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.padded}>
          <TopBar onBack={navigation.goBack} />
          <EmptyState icon="help-circle-outline" title="404" message={t('notSpecified')} actionLabel={t('back')} onAction={navigation.goBack} />
        </View>
      </ScreenContainer>
    );
  }

  const Screen = SERVICE_SCREENS[service.id];
  return <Screen service={service} onBack={navigation.goBack} />;
}

const styles = StyleSheet.create({
  padded: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.lg,
  },
});
