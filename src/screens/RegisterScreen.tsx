import { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { errorMessage } from '../api/client';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PasswordField from '../components/PasswordField';
import PrimaryButton from '../components/PrimaryButton';
import ProfileFields, { EMPTY_STUDY_DRAFT, StudyDraft } from '../components/ProfileFields';
import ScreenScroll from '../components/ScreenScroll';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { hasErrors, isValidContact, passwordError, PASSWORD_MIN_LENGTH, ProfileErrors, validateProfile } from '../utils/validation';

const SUCCESS_MS = 1200;

type AccountErrors = { contact?: string; password?: string; confirm?: string };

export default function RegisterScreen({ navigation }: RootStackScreenProps<'Register'>) {
  const { t } = useI18n();
  const { register } = useAuth();
  const [draft, setDraft] = useState<StudyDraft>(EMPTY_STUDY_DRAFT);
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const busy = useRef(false);

  const handleSubmit = async () => {
    if (busy.current || done) return;
    const nextErrors = validateProfile(draft);
    const pwd = passwordError(password);
    const nextAccount: AccountErrors = {
      contact: isValidContact(contact) ? undefined : t('errContactInvalid'),
      password: pwd ? t(pwd, { min: PASSWORD_MIN_LENGTH }) : undefined,
      confirm: password === confirm ? undefined : t('errPasswordMismatch'),
    };
    setErrors(nextErrors);
    setAccountErrors(nextAccount);
    if (hasErrors(nextErrors) || hasErrors(nextAccount)) {
      setFormError(t('errorsSummary'));
      return;
    }
    busy.current = true;
    Keyboard.dismiss();
    setSubmitting(true);
    setFormError(null);
    try {
      await register({ ...draft, contact: contact.trim(), password, passwordConfirm: confirm }, async () => {
        // Сообщение об успехе видно недолго, затем навигатор сам открывает приложение
        setDone(true);
        await new Promise((resolve) => setTimeout(resolve, SUCCESS_MS));
      });
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  return (
    <ScreenScroll title={t('registerTitle')} subtitle={t('registerSubtitle')} onBack={navigation.goBack}>
      <GlassCard>
        <ProfileFields draft={draft} errors={errors} onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))} />
      </GlassCard>
      <GlassCard>
        <FormField
          label={t('contactLabel')}
          placeholder={t('contactPlaceholder')}
          icon="person-outline"
          value={contact}
          onChangeText={setContact}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          error={accountErrors.contact}
        />
        <PasswordField label={t('passwordLabel')} placeholder={t('passwordHint', { min: PASSWORD_MIN_LENGTH })} value={password} onChangeText={setPassword} autoComplete="new-password" textContentType="newPassword" error={accountErrors.password} />
        <PasswordField label={t('passwordConfirmLabel')} value={confirm} onChangeText={setConfirm} autoComplete="new-password" textContentType="newPassword" error={accountErrors.confirm} />
      </GlassCard>
      {done ? <FormBanner kind="success" text={t('registerDone')} /> : null}
      {formError ? <FormBanner text={formError} /> : null}
      <PrimaryButton title={t('registerSubmit')} arrow loading={submitting} disabled={done} onPress={handleSubmit} />
    </ScreenScroll>
  );
}
