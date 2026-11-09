import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { withAlpha } from '../theme/colors';
import { fonts } from '../theme/typography';

type Props = {
  size?: number;
  /** Цвет значка, кольца и названия */
  color?: string;
};

const APPEAR_MS = 900;

/**
 * Логотип ALTushki: значок в тонком кольце и название.
 * При входе всё один раз мягко проявляется и чуть приближается, без пружин и поворотов.
 * При системной настройке «уменьшить движение» логотип показывается сразу.
 */
export default function AnimatedLogo({ size = 88, color = '#FFFFFF' }: Props) {
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
            borderRadius: size / 2,
            borderColor: withAlpha(color, 0.35),
            opacity: appear,
            transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          },
        ]}
      >
        <Ionicons name="school-outline" size={size * 0.48} color={color} />
      </Animated.View>
      <Animated.View style={{ opacity: titleOpacity }}>
        <Text style={[styles.title, { color, fontSize: size * 0.36 }]}>ALTushki</Text>
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
    borderWidth: 1.5,
  },
  title: {
    fontFamily: fonts.regular,
    letterSpacing: -0.8,
  },
});
