import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Switch, TextInputInstance, View } from 'react-native';
import AnimatedLogo from '../components/AnimatedLogo';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PasswordField from '../components/PasswordField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';

/** Первый экран приложения: без входа или регистрации дальше пройти нельзя. После входа навигатор сам открывает главный экран. */
export default function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { colors } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { signIn } = useAuth();

  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  // Защита от двойного нажатия: ref обновляется сразу, состояние — только при следующей отрисовке
  const busy = useRef(false);

  const handleSubmit = async () => {
    if (busy.current) return;
    if (!contact.trim() || !password) {
      setError(t('errLoginEmpty'));
      return;
    }
    busy.current = true;
    Keyboard.dismiss();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(contact.trim(), password, remember);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  return (
    <ScreenScroll
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      right={LANGUAGES.map((item) => (
        <Chip key={item.code} label={item.short} selected={language === item.code} onPress={() => setLanguage(item.code)} />
      ))}
    >
      <View style={styles.logo}>
        <AnimatedLogo size={72} titleColor={colors.text} />
      </View>
      <GlassCard style={styles.card}>
        {error ? <FormBanner text={error} /> : null}
        <FormField
          label={t('contactLabel')}
          placeholder={t('contactPlaceholder')}
          icon="person-outline"
          value={contact}
          onChangeText={setContact}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          keyboardType="email-address"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <PasswordField
          ref={passwordRef}
          label={t('passwordLabel')}
          value={password}
          onChangeText={setPassword}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        <View style={styles.row}>
          <Text style={[type.body, styles.flex, { color: colors.text }]}>{t('rememberMe')}</Text>
          <Switch value={remember} onValueChange={setRemember} trackColor={{ false: colors.border, true: colors.primary }} accessibilityLabel={t('rememberMe')} />
        </View>
        <PrimaryButton title={t('signIn')} arrow loading={submitting} onPress={handleSubmit} />
        <PrimaryButton title={t('forgotPassword')} variant="glass" compact onPress={() => navigation.navigate('Forgot')} />
      </GlassCard>

      <PrimaryButton title={t('registerOpen')} variant="glass" icon="person-add-outline" onPress={() => navigation.navigate('Register')} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  logo: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  card: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
