import SplashView from '../components/SplashView';
import { useI18n } from '../i18n/LanguageContext';

/** Экран загрузки при запуске: пока читаются сессия, тема, язык и данные сервисов. */
export default function LoadingScreen() {
  const { t } = useI18n();
  return <SplashView message={t('loading')} />;
}
