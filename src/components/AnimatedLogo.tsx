import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { fonts } from '../theme/typography';

type Props = {
  size?: number;
  /** Цвет названия под значком */
  color?: string;
};

const APPEAR_MS = 900;

/**
 * Логотип ALTushki: синий квадрат со скруглёнными углами и белой шапочкой, под ним название.
 * При входе он один раз мягко проявляется и чуть приближается, затем проявляется название.
 * При системной настройке «уменьшить движение» логотип показывается сразу.
 */
export default function AnimatedLogo({ size = 80, color = '#FFFFFF' }: Props) {
  const [appear] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) appear.setValue(1);
        else Animated.timing(appear, { toValue: 1, duration: APPEAR_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [appear]);

  // Название появляется чуть позже значка, в той же плавной анимации
  const titleOpacity = appear.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });

  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel="ALTushki">
      <Animated.View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size * 0.32,
            opacity: appear,
            transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          },
        ]}
      >
        <Ionicons name="school" size={size * 0.48} color="#FFFFFF" />
      </Animated.View>
      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleOpacity.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>
        <Text style={[styles.title, { color, fontSize: size * 0.42 }]}>ALTushki</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 16,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6BFF',
  },
  title: {
    fontFamily: fonts.regular,
    letterSpacing: -1,
  },
});
