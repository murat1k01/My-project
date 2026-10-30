import type { Service } from '../../types/Service';

/** Общие props всех экранов сервисов. */
export type ServiceScreenProps = {
  service: Service;
  onBack: () => void;
};
