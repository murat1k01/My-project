import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInputInstance,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Chip from '../components/Chip';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SplashView from '../components/SplashView';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { images } from '../data/images';
import { SERVICES } from '../data/services';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { withAlpha } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing, TOUCH_SIZE } from '../theme/metrics';
import { type } from '../theme/typography';
import { hasErrors, LOGIN_MIN_LENGTH, LoginErrors, PASSWORD_MIN_LENGTH, validateLogin } from '../utils/validation';

/** Длительность экрана загрузки после нажатия «Войти», мс */
const SIGN_IN_ANIMATION_MS = 1400;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Экран входа. Это УЧЕБНАЯ локальная авторизация:
 * логин и пароль проверяются только по правилам формы на устройстве,
 * сервер не используется, пароль никуда не сохраняется.
 */
export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { signIn } = useAppData();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [signingIn, setSigningIn] = useState(false);

  const passwordRef = useRef<TextInputInstance>(null);
  const appear = useRef(new Animated.Value(0)).current;

  // Плавное появление формы при открытии экрана
  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [appear]);

  const handleLoginChange = (text: string) => {
    setLogin(text);
    if (errors.login) setErrors((prev) => ({ ...prev, login: undefined }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateLogin(login, password);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    Keyboard.dismiss();
    setSigningIn(true);
    // Показываем экран загрузки входа, затем сохраняем сессию — навигатор сам откроет главный экран
    await wait(SIGN_IN_ANIMATION_MS);
    const persisted = await signIn(login.trim());
    if (!persisted) {
      Alert.alert(t('sessionNotSavedTitle'), t('sessionNotSavedText'));
    }
  };

  if (signingIn) {
    return <SplashView message={t('loadingSignIn')} duration={SIGN_IN_ANIMATION_MS} />;
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      {/* Земля внизу экрана, как в референсе */}
      <View style={styles.earthWrap} pointerEvents="none">
        {/* В светлой теме Земля едва заметна, чтобы текст оставался читаемым */}
        <Image source={images.heroEarth} style={[styles.earth, { opacity: isDark ? 0.7 : 0.15 }]} resizeMode="cover" />
        <LinearGradient colors={[colors.background, withAlpha(colors.background, 0)] as const} style={styles.earthFade} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View
            style={[
              styles.content,
              { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] },
            ]}
          >
            {/* До входа нижней навигации нет, поэтому язык можно выбрать прямо здесь */}
            <TopBar
              label={t('appName')}
              right={LANGUAGES.map((item) => (
                <Chip key={item.code} label={item.short} selected={language === item.code} onPress={() => setLanguage(item.code)} />
              ))}
            />

            <View style={styles.titleBlock}>
              <Text style={[type.display, styles.title, { color: colors.text }]}>{t('loginTitle')}</Text>
              <Text style={[type.caption, { color: colors.textSecondary }]}>{t('loginSubtitle')}</Text>
            </View>

            <View style={styles.iconRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {SERVICES.slice(0, 6).map((service) => (
                <View key={service.id} style={[styles.serviceIcon, { backgroundColor: colors.glass, borderColor: colors.border }]}>
                  <Ionicons name={service.icon} size={16} color={colors.text} />
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }]}>
              {hasErrors(errors) ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft }]} accessibilityLiveRegion="polite">
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={[type.caption, styles.flex, { color: colors.danger }]}>{t('errorsSummary')}</Text>
                </View>
              ) : null}

              <FormField
                label={t('loginLabel')}
                placeholder={t('loginPlaceholder', { min: LOGIN_MIN_LENGTH })}
                icon="person-outline"
                value={login}
                onChangeText={handleLoginChange}
                error={errors.login ? t(errors.login, { min: LOGIN_MIN_LENGTH }) : undefined}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <FormField
                ref={passwordRef}
                label={t('passwordLabel')}
                placeholder={t('passwordPlaceholder', { min: PASSWORD_MIN_LENGTH })}
                icon="lock-closed-outline"
                value={password}
                onChangeText={handlePasswordChange}
                error={errors.password ? t(errors.password, { min: PASSWORD_MIN_LENGTH }) : undefined}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                rightAccessory={
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? t('hidePassword') : t('showPassword')}
                    hitSlop={8}
                    style={styles.eyeButton}
                  >
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
                  </Pressable>
                }
              />

              <PrimaryButton title={t('signIn')} arrow onPress={handleSubmit} />
            </View>

            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text style={[type.caption, styles.flex, { color: colors.textMuted }]}>{t('localAuthNote')}</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  earthWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
  },
  earth: {
    width: '100%',
    height: '100%',
  },
  earthFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  titleBlock: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  serviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  eyeButton: {
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    marginRight: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
