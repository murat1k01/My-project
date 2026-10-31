import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '../data/images';
import { radius } from '../theme/metrics';
import { fonts } from '../theme/typography';

type Props = {
  message: string;
  /** Длительность заполнения полосы загрузки, мс */
  duration?: number;
};

/**
 * Экран загрузки: фирменный тёмно-синий фон, Земля снизу, логотип и анимированная полоса.
 * Цвета фиксированные (не зависят от темы) — это «обложка» приложения.
 */
export default function SplashView({ message, duration = 1600 }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(appear, { toValue: 1, duration: 500, useNativeDriver: true }),
      // Ширину нельзя анимировать нативным драйвером, поэтому здесь useNativeDriver: false
      Animated.timing(progress, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [appear, progress, duration]);

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <LinearGradient colors={['#123A9C', '#04060F'] as const} style={StyleSheet.absoluteFill} />
      <Image source={images.heroEarth} style={styles.earth} resizeMode="cover" />
      <LinearGradient colors={['#04060F', 'rgba(4, 6, 15, 0)'] as const} style={styles.earthFade} />

      <Animated.View
        style={[
          styles.center,
          { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
        ]}
      >
        <View style={styles.logo}>
          <Ionicons name="school" size={38} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>ALTushki</Text>
        <View style={styles.track}>
          <Animated.View
            style={[styles.bar, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
          />
        </View>
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
    width: '70%',
    maxWidth: 320,
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
  track: {
    marginTop: 28,
    width: '100%',
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  message: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
