import { Alert } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n/LanguageContext';

/** Выход с подтверждением — используется в профиле и настройках. */
export function useSignOut(): () => void {
  const { signOut } = useAppData();
  const { t } = useI18n();

  return () => {
    Alert.alert(t('signOutTitle'), t('signOutText'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOutConfirm'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };
}
