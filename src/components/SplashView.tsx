import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedLogo from './AnimatedLogo';
import { Text } from './AppText';
import { images } from '../data/images';
import { SLOGAN } from '../theme/brand';
import { fonts } from '../theme/typography';

type Props = {
  message: string;
};

const NAVY = '#0C233F';
const GOLD = '#C5A46D';

/**
 * Экран запуска Oxford Academic Premium: фото Оксфорда на весь экран с тёмно-синим затемнением,
 * прежний логотип ALTushki, надпись ALT UNIVERSITY, слоган и тонкая золотая линия загрузки.
 * Цвета не зависят от темы: это «обложка» приложения. При «уменьшении движения» всё показывается сразу.
 */
export default function SplashView({ message }: Props) {
  const [zoom] = useState(() => new Animated.Value(0));
  const [line] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          zoom.setValue(1);
          line.setValue(1);
          return;
        }
        // Фото медленно приближается, а золотая линия бежит, пока приложение загружается
        Animated.timing(zoom, { toValue: 1, duration: 6000, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        loop = Animated.loop(Animated.timing(line, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
        loop.start();
      });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [zoom, line]);

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <Animated.Image
        source={images.oxfordSunset}
        style={[StyleSheet.absoluteFill, styles.photo, { transform: [{ scale: zoom.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) }] }]}
        resizeMode="cover"
      />
      <LinearGradient colors={['rgba(12, 35, 63, 0.35)', 'rgba(12, 35, 63, 0.78)', NAVY] as const} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.center}>
        <AnimatedLogo size={84} color="#F5F0E6" />
        <Text style={styles.university}>ALT UNIVERSITY</Text>
        <View style={styles.rule} />
        <Text style={styles.slogan}>{SLOGAN}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { transform: [{ translateX: line.interpolate({ inputRange: [0, 1], outputRange: [-60, 140] }) }] }]} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  center: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  university: {
    marginTop: 4,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 5,
    color: GOLD,
  },
  rule: {
    width: 64,
    height: 1,
    backgroundColor: GOLD,
  },
  slogan: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    color: '#F5F0E6',
    textAlign: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: 72,
    alignItems: 'center',
    gap: 12,
  },
  track: {
    width: 140,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(245, 240, 230, 0.18)',
  },
  bar: {
    width: 60,
    height: 2,
    backgroundColor: GOLD,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(245, 240, 230, 0.75)',
  },
});
