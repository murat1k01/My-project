import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LogoMark } from '../components/AnimatedLogo';
import { Text } from '../components/AppText';
import Avatar from '../components/Avatar';
import FormBanner from '../components/FormBanner';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import { useAuth } from '../context/AuthContext';
import { images } from '../data/images';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { brand } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';

const CARD_HEIGHT = 330;

/**
 * Цифровой студенческий билет внутри приложения: кремовая карта с логотипом, золотой полосой и силуэтом архитектуры.
 * Нажатие переворачивает карту; по ней время от времени пробегает золотой блик.
 * Это демонстрационная карта, а не официальный документ: QR-кода нет, пока университет не подключит проверку.
 */
export default function StudentCardScreen({ navigation }: RootStackScreenProps<'StudentCard'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const [flip] = useState(() => new Animated.Value(0));
  const [shine] = useState(() => new Animated.Value(0));
  const [appear] = useState(() => new Animated.Value(0));
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (reduce) {
          appear.setValue(1);
          return;
        }
        Animated.spring(appear, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
        loop = Animated.loop(
          Animated.sequence([Animated.delay(2200), Animated.timing(shine, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }), Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: true })]),
        );
        loop.start();
      });
    return () => loop?.stop();
  }, [appear, shine]);

  const toggle = () => {
    Animated.spring(flip, { toValue: flipped ? 0 : 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    setFlipped((prev) => !prev);
  };

  if (!user) return null;
  const appId = `ALT-${user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const front = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const back = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const enter = { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }, { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] };

  const rows = [
    { label: t('cardId'), value: appId },
    { label: t('faculty'), value: user.faculty },
    { label: t('program'), value: user.program },
    { label: t('cardGroupCourse'), value: `${user.group} · ${t('courseN', { n: user.course })}` },
  ];

  return (
    <ScreenScroll title={t('cardTitle')} onBack={navigation.goBack}>
      <Animated.View style={enter}>
        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={t('cardFlip')} style={styles.cardArea}>
          {/* Лицевая сторона */}
          <Animated.View style={[styles.card, { transform: [{ perspective: 1000 }, { rotateY: front }] }]}>
            <Image source={images.oxfordDay} style={styles.watermark} resizeMode="cover" />
            <View style={styles.cardHead}>
              <LogoMark size={40} />
              <View>
                <Text style={styles.cardBrand}>ALTushki</Text>
                <Text style={styles.cardUni}>ALT UNIVERSITY</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.photo}>
                <Avatar firstName={user.firstName} lastName={user.lastName} seed={user.id} size={92} photo={user.photo} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {user.firstName} {user.lastName}
                </Text>
                {rows.map((row) => (
                  <View key={row.label}>
                    <Text style={styles.label}>{row.label}</Text>
                    <Text style={styles.value} numberOfLines={1}>
                      {row.value || '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <LinearGradient colors={['#C9A35E', '#B68B40', '#D4B77C'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.stripe}>
              <Text style={styles.stripeText}>{t('cardStripe')}</Text>
            </LinearGradient>
            {/* Золотой блик */}
            <Animated.View pointerEvents="none" style={[styles.shine, { transform: [{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-160, 460] }) }, { rotate: '20deg' }] }]}>
              <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255, 236, 190, 0.55)', 'rgba(255,255,255,0)'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </Animated.View>

          {/* Оборотная сторона */}
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ perspective: 1000 }, { rotateY: back }] }]}>
            <LogoMark size={64} />
            <Ionicons name="qr-code-outline" size={40} color={brand.gold} />
            <Text style={styles.backText}>{t('cardNoQr')}</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('cardHint')}</Text>
      <FormBanner kind="info" text={t('cardDemoNote')} />
      <View style={styles.actions}>
        <PrimaryButton title={t('profileEdit')} icon="camera-outline" variant="glass" style={styles.flex} onPress={() => navigation.navigate('ProfileEdit')} />
        <PrimaryButton title={t('gridLibrary')} icon="book-outline" variant="glass" style={styles.flex} onPress={() => navigation.navigate('Library')} />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  cardArea: {
    height: CARD_HEIGHT,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    backgroundColor: '#F8F3E8',
    borderWidth: 1.5,
    borderColor: brand.antiqueGold,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    shadowColor: '#0C2035',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  watermark: {
    position: 'absolute',
    right: -40,
    top: 40,
    width: 260,
    height: 220,
    opacity: 0.1,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  cardBrand: {
    fontFamily: fonts.serifBold,
    fontSize: 24,
    lineHeight: 26,
    color: brand.navy,
  },
  cardUni: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 3,
    color: brand.antiqueGold,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  photo: {
    padding: 3,
    borderRadius: 52,
    borderWidth: 1.5,
    borderColor: brand.antiqueGold,
    alignSelf: 'flex-start',
  },
  info: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontFamily: fonts.card,
    fontSize: 18,
    lineHeight: 23,
    color: brand.navy,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#77746D',
  },
  value: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: '#17212B',
  },
  stripe: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripeText: {
    fontFamily: fonts.card,
    fontSize: 14,
    color: brand.navy,
  },
  shine: {
    position: 'absolute',
    top: -60,
    bottom: -60,
    width: 70,
  },
  cardBack: {
    backgroundColor: brand.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  backText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: brand.ivory,
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
