import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { errorMessage } from '../api/client';
import FormBanner from '../components/FormBanner';
import GlassCard from '../components/GlassCard';
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

/** Квадратное фото небольшого размера: сервер принимает изображение до ~2,5 МБ в base64 */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true };

/** Профиль вошедшего пользователя: все данные приходят с сервера. Фото можно выбрать или сделать прямо здесь. */
export default function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { t, language } = useI18n();
  const { user, isAdmin, updateProfile } = useAuth();
  const signOut = useSignOut();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const savePhoto = async (photo: string | null) => {
    if (!user) return;
    setPhotoBusy(true);
    setPhotoMessage(null);
    try {
      await updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        university: user.university,
        faculty: user.faculty,
        program: user.program,
        group: user.group,
        course: user.course,
        showInDirectory: user.showInDirectory,
        showPhone: user.showPhone,
        photo,
      });
      setPhotoMessage({ kind: 'success', text: photo ? t('photoSaved') : t('photoRemoved') });
    } catch (e) {
      setPhotoMessage({ kind: 'error', text: errorMessage(e) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const pick = async (source: 'library' | 'camera') => {
    setPhotoMessage(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setPhotoMessage({ kind: 'error', text: t('photoCameraDenied') });
          return;
        }
      }
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS) : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        setPhotoMessage({ kind: 'error', text: t('photoError') });
        return;
      }
      await savePhoto(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    } catch (e) {
      setPhotoMessage({ kind: 'error', text: errorMessage(e) });
    }
  };

  return (
    <ScreenScroll title={t('profileTitle')}>
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
          <GlassCard>
            <View style={styles.photoButtons}>
              <PrimaryButton title={t('photoUpload')} icon="image-outline" variant="glass" compact loading={photoBusy} onPress={() => void pick('library')} />
              {/* В браузере камеры нет: там фото выбирается из файлов */}
              {Platform.OS !== 'web' ? <PrimaryButton title={t('photoTake')} icon="camera-outline" variant="glass" compact disabled={photoBusy} onPress={() => void pick('camera')} /> : null}
              {user.photo ? <PrimaryButton title={t('photoRemove')} variant="danger" compact disabled={photoBusy} onPress={() => void savePhoto(null)} /> : null}
            </View>
            {photoMessage ? <FormBanner kind={photoMessage.kind} text={photoMessage.text} /> : null}
          </GlassCard>
          <PrimaryButton title={t('profileEdit')} arrow onPress={() => navigation.navigate('ProfileEdit')} />
          <SubscriptionBanner onPress={() => navigation.navigate('Subscription')} />
          <PrimaryButton title={t('cardTitle')} variant="glass" icon="id-card-outline" onPress={() => navigation.navigate('StudentCard')} />
          <PrimaryButton title={t('requestsTitle')} variant="glass" icon="document-text-outline" onPress={() => navigation.navigate('Requests')} />
          <PrimaryButton title={t('settingsTitle')} variant="glass" icon="settings-outline" onPress={() => navigation.navigate('Settings')} />
          {isAdmin ? <PrimaryButton title={t('adminTitle')} variant="glass" icon="shield-checkmark-outline" onPress={() => navigation.navigate('Admin')} /> : null}
          <PrimaryButton title={t('signOut')} variant="danger" icon="log-out-outline" onPress={signOut} />
        </View>
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  photoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
