import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { fonts } from '../theme/typography';

type Props = {
  size?: number;
  titleColor?: string;
};

/**
 * Логотип с анимацией появления: значок выпрыгивает с лёгким поворотом шапочки, затем проявляется название.
 * Анимация проигрывается один раз, а при системной настройке «уменьшить движение» логотип показывается сразу.
 */
export default function AnimatedLogo({ size = 88, titleColor = '#FFFFFF' }: Props) {
  const [mark] = useState(() => new Animated.Value(0));
  const [cap] = useState(() => new Animated.Value(0));
  const [title] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          [mark, cap, title].forEach((value) => value.setValue(1));
          return;
        }
        Animated.sequence([
          Animated.parallel([
            Animated.spring(mark, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
            Animated.timing(cap, { toValue: 1, duration: 650, easing: Easing.out(Easing.back(2.5)), useNativeDriver: true }),
          ]),
          Animated.timing(title, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      });
    return () => {
      cancelled = true;
    };
  }, [mark, cap, title]);

  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel="Campus Hub">
      <Animated.View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size * 0.32,
            opacity: mark.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
            transform: [{ scale: mark.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: cap.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '0deg'] }) }] }}>
          <Ionicons name="school" size={size * 0.5} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={{ opacity: title, transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
        <Text style={[styles.title, { color: titleColor, fontSize: size * 0.38 }]}>Campus Hub</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 14,
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
