import { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, TextInputInstance, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedLogo from '../components/AnimatedLogo';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import PrimaryButton from '../components/PrimaryButton';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { images } from '../data/images';
import { useAppear } from '../hooks/useAppear';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { loadLastLogin, saveLastLogin } from '../storage/storage';
import type { RootStackScreenProps } from '../navigation/types';
import { brand, SLOGAN } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';

/**
 * Первый экран приложения: без входа или регистрации дальше пройти нельзя. После входа навигатор сам открывает главный экран.
 * Сверху — фото Radcliffe Camera на закате с логотипом и слоганом, снизу — кремовая панель с формой.
 */
export default function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { colors, isDark } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const formStyle = useAppear(28);

  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  // Подставляем email или телефон с прошлого входа. Пароль приложение не хранит:
  // вход сохраняется токеном в защищённом хранилище системы, а пароль может запомнить менеджер паролей телефона
  useEffect(() => {
    let cancelled = false;
    void loadLastLogin().then((saved) => {
      if (!cancelled && saved) setContact((prev) => prev || saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);
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
      await saveLastLogin(remember ? contact.trim() : null);
      await signIn(contact.trim(), password, remember);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <ImageBackground source={images.oxfordSunset} style={[styles.hero, { paddingTop: insets.top + spacing.md }]} resizeMode="cover">
            <LinearGradient colors={['rgba(0, 33, 71, 0.25)', 'rgba(0, 33, 71, 0.7)', isDark ? colors.background : 'rgba(0, 33, 71, 0.92)'] as const} style={StyleSheet.absoluteFill} />
            <View style={styles.langs}>
              {LANGUAGES.map((item) => (
                <Chip key={item.code} label={item.short} selected={language === item.code} onPress={() => setLanguage(item.code)} />
              ))}
            </View>
            <View style={styles.heroCenter}>
              <AnimatedLogo size={68} color={brand.ivory} />
              <View style={styles.rule} />
              <Text style={styles.slogan}>{SLOGAN}</Text>
            </View>
          </ImageBackground>

          <Animated.View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.gold }, formStyle]}>
            <View style={styles.content}>
              <View style={styles.titleBlock}>
                <Text style={[type.title, { color: isDark ? colors.text : colors.primary }]} accessibilityRole="header">
                  {t('loginTitle')}
                </Text>
                <Text style={[type.body, { color: colors.textSecondary }]}>{t('loginSubtitle')}</Text>
              </View>

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
                <Switch value={remember} onValueChange={setRemember} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" {...{ activeThumbColor: '#FFFFFF' }} accessibilityLabel={t('rememberMe')} />
              </View>
              <PrimaryButton title={t('signIn')} arrow loading={submitting} onPress={handleSubmit} />
              <PrimaryButton title={t('forgotPassword')} variant="glass" compact onPress={() => navigation.navigate('Forgot')} />
              <View style={styles.divider}>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
                <View style={[styles.diamond, { backgroundColor: colors.gold }]} />
                <View style={[styles.line, { backgroundColor: colors.border }]} />
              </View>
              <PrimaryButton title={t('registerOpen')} variant="glass" icon="person-add-outline" onPress={() => navigation.navigate('Register')} />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    width: '100%',
    minHeight: 340,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 56,
  },
  langs: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  rule: {
    width: 56,
    height: 1,
    backgroundColor: brand.gold,
  },
  slogan: {
    fontFamily: fonts.serif,
    fontSize: 21,
    lineHeight: 26,
    color: brand.ivory,
    textAlign: 'center',
  },
  sheet: {
    flexGrow: 1,
    marginTop: -32,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
  },
  diamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: '45deg' }],
  },
});
