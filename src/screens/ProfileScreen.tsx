import { StyleSheet, View } from 'react-native';
import AuthGate from '../components/AuthGate';
import PrimaryButton from '../components/PrimaryButton';
import ProfileCard from '../components/ProfileCard';
import ScreenScroll from '../components/ScreenScroll';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { useAuth } from '../context/AuthContext';
import { useSignOut } from '../hooks/useSignOut';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { spacing } from '../theme/metrics';
import { formatDate, formatPhone } from '../utils/format';

/** Профиль вошедшего пользователя: все данные приходят с сервера. */
export default function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { t, language } = useI18n();
  const { user, isAdmin } = useAuth();
  const signOut = useSignOut();

  return (
    <ScreenScroll title={t('profileTitle')}>
      <AuthGate>
        {user ? (
          <View style={styles.content}>
            <ProfileCard
              firstName={user.firstName}
              lastName={user.lastName}
              seed={user.id}
              photo={user.photo}
              badge={user.group}
              rows={[
                { icon: 'school-outline', label: t('university'), value: user.university },
                { icon: 'business-outline', label: t('faculty'), value: user.faculty },
                { icon: 'book-outline', label: t('program'), value: user.program },
                { icon: 'people-outline', label: t('group'), value: user.group },
                { icon: 'ribbon-outline', label: t('course'), value: String(user.course) },
                ...(user.email ? [{ icon: 'mail-outline' as const, label: t('profileEmail'), value: user.email }] : []),
                ...(user.phone ? [{ icon: 'call-outline' as const, label: t('phone'), value: formatPhone(user.phone) }] : []),
                { icon: 'calendar-outline', label: t('registeredAt'), value: formatDate(user.createdAt, language) },
              ]}
            />
            <PrimaryButton title={t('profileEdit')} arrow onPress={() => navigation.navigate('ProfileEdit')} />
            <SubscriptionBanner onPress={() => navigation.navigate('Subscription')} />
            <PrimaryButton title={t('requestsTitle')} variant="glass" icon="document-text-outline" onPress={() => navigation.navigate('Requests')} />
            <PrimaryButton title={t('settingsTitle')} variant="glass" icon="settings-outline" onPress={() => navigation.navigate('Settings')} />
            {isAdmin ? <PrimaryButton title={t('adminTitle')} variant="glass" icon="shield-checkmark-outline" onPress={() => navigation.navigate('Admin')} /> : null}
            <PrimaryButton title={t('signOut')} variant="danger" icon="log-out-outline" onPress={signOut} />
          </View>
        ) : null}
      </AuthGate>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
});
