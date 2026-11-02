import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { confirmAction } from '../utils/dialogs';

/** Выход с подтверждением — используется в профиле и настройках. */
export function useSignOut(): () => void {
  const { signOut } = useAuth();
  const { t } = useI18n();

  return () => {
    confirmAction({ title: t('signOutTitle'), text: t('signOutText'), confirm: t('signOutConfirm'), cancel: t('cancel'), destructive: true, onConfirm: () => void signOut() });
  };
}
