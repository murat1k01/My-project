import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { images } from '../data/images';
import { fonts } from '../theme/typography';

type Props = {
  size?: number;
  /** Цвет названия под значком */
  color?: string;
};

const APPEAR_MS = 900;

/**
 * Логотип ALTushki — герб автора проекта: тёмно-синий щит, шапочка, книга, здание и лавровые ветви. Под ним название.
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
            borderRadius: size * 0.22,
            opacity: appear,
            transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          },
        ]}
      >
        <Image source={images.logo} style={styles.image} resizeMode="cover" />
      </Animated.View>
      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleOpacity.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>
        <Text style={[styles.title, { color, fontSize: size * 0.42 }]}>ALTushki</Text>
      </Animated.View>
    </View>
  );
}

/** Тот же значок логотипа без названия и анимации — для шапки главного экрана. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.22 }]} accessibilityRole="image" accessibilityLabel="ALTushki">
      <Image source={images.logo} style={styles.image} resizeMode="cover" />
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
    overflow: 'hidden',
    backgroundColor: '#15253E',
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.6)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: fonts.serifBold,
    letterSpacing: 0.5,
  },
});
