import type { Service } from '../../types/Service';

/** Общие props всех экранов сервисов. */
export type ServiceScreenProps = {
  service: Service;
  onBack: () => void;
  /** Переход на общие экраны приложения из сервиса (заявки, подписка) */
  openScreen: (screen: 'Requests' | 'Subscription') => void;
};
