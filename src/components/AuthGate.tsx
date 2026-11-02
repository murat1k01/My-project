import { ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/metrics';
import EmptyState from './EmptyState';

/**
 * Защищённый раздел. Без входа сразу открывает экран входа, а после входа
 * пользователь возвращается сюда же: экран входа просто закрывается.
 * Если вход отменён, показывается приглашение войти, а не личные данные.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const focused = useIsFocused();
  const redirected = useRef(false);

  useEffect(() => {
    if (!user && focused && !redirected.current) {
      redirected.current = true;
      navigation.navigate('Login');
    }
    if (user) redirected.current = false;
  }, [focused, navigation, user]);

  if (user) return <>{children}</>;
  return (
    <View style={styles.wrap}>
      <EmptyState icon="lock-closed-outline" title={t('authRequiredTitle')} message={t('authRequiredText')} actionLabel={t('signIn')} onAction={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
  },
});
