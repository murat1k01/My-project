import { useState } from 'react';
import { api, errorMessage } from '../api/client';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PasswordField from '../components/PasswordField';
import PasswordRules from '../components/PasswordRules';
import { useFieldFocus } from '../hooks/useFieldFocus';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { isValidContact, passwordError, PASSWORD_MIN_LENGTH } from '../utils/validation';

type Step = 'contact' | 'code' | 'done';

/** Восстановление пароля в два шага: запрос кода и ввод кода с новым паролем. */
export default function ForgotPasswordScreen({ navigation }: RootStackScreenProps<'Forgot'>) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localCode, setLocalCode] = useState<string | null>(null);
  const passwordFocus = useFieldFocus();

  const run = async (action: () => Promise<void>) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const requestCode = () => {
    if (!isValidContact(contact)) {
      setError(t('errContactInvalid'));
      return;
    }
    void run(async () => {
      // Встроенная база на телефоне не отправляет письма: код показывается владельцу устройства
      const result = await api<{ localCode?: string }>('POST', '/api/auth/forgot', { contact: contact.trim() });
      setLocalCode(result.localCode ?? null);
      setStep('code');
    });
  };

  const resetPassword = () => {
    const pwd = passwordError(password);
    if (pwd) {
      setError(t(pwd, { min: PASSWORD_MIN_LENGTH }));
      return;
    }
    if (password !== confirm) {
      setError(t('errPasswordMismatch'));
      return;
    }
    void run(async () => {
      await api('POST', '/api/auth/reset', { contact: contact.trim(), code: code.trim(), password });
      setStep('done');
    });
  };

  return (
    <ScreenScroll title={t('forgotTitle')} subtitle={t('forgotSubtitle')} onBack={navigation.goBack}>
      {error ? <FormBanner text={error} /> : null}
      {step === 'contact' ? (
        <GlassCard>
          <FormField label={t('contactLabel')} placeholder={t('contactPlaceholder')} icon="person-outline" value={contact} onChangeText={setContact} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
          <PrimaryButton title={t('forgotSend')} arrow loading={submitting} onPress={requestCode} />
        </GlassCard>
      ) : null}
      {step === 'code' ? (
        <GlassCard>
          <FormBanner kind="info" text={localCode ? t('forgotLocalCode', { code: localCode }) : t('forgotCodeNote')} />
          <FormField label={t('forgotCode')} icon="keypad-outline" value={code} onChangeText={setCode} keyboardType="number-pad" />
          <PasswordField label={t('newPassword')} value={password} onChangeText={setPassword} onFocus={passwordFocus.onFocus} onBlur={passwordFocus.onBlur} autoComplete="new-password" />
          <PasswordField label={t('passwordConfirmLabel')} value={confirm} onChangeText={setConfirm} onFocus={passwordFocus.onFocus} onBlur={passwordFocus.onBlur} autoComplete="new-password" />
          {passwordFocus.focused ? <PasswordRules password={password} confirm={confirm} /> : null}
          <PrimaryButton title={t('forgotSave')} arrow loading={submitting} onPress={resetPassword} />
        </GlassCard>
      ) : null}
      {step === 'done' ? (
        <>
          <FormBanner kind="success" text={t('forgotDone')} />
          <PrimaryButton title={t('signIn')} arrow onPress={navigation.goBack} />
        </>
      ) : null}
    </ScreenScroll>
  );
}
