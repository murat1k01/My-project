import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { errorMessage } from '../api/client';
import { Text } from '../components/AppText';
import AuthGate from '../components/AuthGate';
import Avatar from '../components/Avatar';
import FormBanner from '../components/FormBanner';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ProfileFields, { StudyDraft } from '../components/ProfileFields';
import ScreenScroll from '../components/ScreenScroll';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { hasErrors, ProfileErrors, validateProfile } from '../utils/validation';

export default function ProfileEditScreen({ navigation }: RootStackScreenProps<'ProfileEdit'>) {
  const { t } = useI18n();
  return (
    <ScreenScroll title={t('profileEdit')} onBack={navigation.goBack}>
      <AuthGate>
        <EditForm onSaved={navigation.goBack} />
      </AuthGate>
    </ScreenScroll>
  );
}

function EditForm({ onSaved }: { onSaved: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user, updateProfile } = useAuth();
  const [draft, setDraft] = useState<StudyDraft>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    university: user?.university ?? '',
    faculty: user?.faculty ?? '',
    program: user?.program ?? '',
    group: user?.group ?? '',
    course: user?.course ?? 0,
  });
  const [photo, setPhoto] = useState<string | null>(user?.photo ?? null);
  const [showInDirectory, setShowInDirectory] = useState(user?.showInDirectory ?? true);
  const [showPhone, setShowPhone] = useState(user?.showPhone ?? false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        setError(t('photoError'));
        return;
      }
      setPhoto(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const save = async () => {
    if (saving) return;
    const nextErrors = validateProfile(draft);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setError(t('errorsSummary'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ ...draft, photo, showInDirectory, showPhone });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.content}>
      <GlassCard style={styles.photo}>
        <Avatar firstName={draft.firstName} lastName={draft.lastName} seed={user.id} size={96} photo={photo} />
        <View style={styles.photoButtons}>
          <PrimaryButton title={t('photoChoose')} variant="glass" compact icon="image-outline" onPress={pickPhoto} />
          {photo ? <PrimaryButton title={t('photoRemove')} variant="danger" compact onPress={() => setPhoto(null)} /> : null}
        </View>
      </GlassCard>

      <GlassCard>
        <ProfileFields draft={draft} errors={errors} onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))} />
      </GlassCard>

      <GlassCard>
        <Text style={[type.subheading, { color: colors.text }]}>{t('privacyTitle')}</Text>
        <View style={styles.row}>
          <Text style={[type.body, styles.flex, { color: colors.textSecondary }]}>{t('privacyDirectory')}</Text>
          <Switch value={showInDirectory} onValueChange={setShowInDirectory} trackColor={{ false: colors.border, true: colors.primary }} accessibilityLabel={t('privacyDirectory')} />
        </View>
        <View style={styles.row}>
          <Text style={[type.body, styles.flex, { color: colors.textSecondary }]}>{t('privacyPhone')}</Text>
          <Switch value={showPhone} onValueChange={setShowPhone} trackColor={{ false: colors.border, true: colors.primary }} accessibilityLabel={t('privacyPhone')} />
        </View>
      </GlassCard>

      {error ? <FormBanner text={error} /> : null}
      <PrimaryButton title={t('save')} arrow loading={saving} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  photo: {
    alignItems: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
