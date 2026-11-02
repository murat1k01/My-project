import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './AppText';
import { images } from '../data/images';
import { fonts } from '../theme/typography';

const APPEAR_MS = 600;

type Props = {
  message: string;
};

/**
 * Экран запуска: логотип один раз плавно появляется и немного увеличивается.
 * Анимация не зациклена и не задерживает загрузку, а при системной настройке
 * «уменьшить движение» логотип показывается сразу. Цвета не зависят от темы: это «обложка» приложения.
 */
export default function SplashView({ message }: Props) {
  const [appear] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) appear.setValue(1);
        else Animated.timing(appear, { toValue: 1, duration: APPEAR_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [appear]);

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <LinearGradient colors={['#123A9C', '#04060F'] as const} style={StyleSheet.absoluteFill} />
      <Image source={images.heroEarth} style={styles.earth} resizeMode="cover" />
      <LinearGradient colors={['#04060F', 'rgba(4, 6, 15, 0)'] as const} style={styles.earthFade} />

      <Animated.View
        style={[styles.center, { opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] }]}
      >
        <View style={styles.logo}>
          <Ionicons name="school" size={38} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Campus Hub</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04060F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  earth: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    width: '100%',
    opacity: 0.85,
  },
  earthFade: {
    position: 'absolute',
    bottom: '25%',
    left: 0,
    right: 0,
    height: '20%',
  },
  center: {
    alignItems: 'center',
    marginBottom: '20%',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6BFF',
  },
  title: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 34,
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  message: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
