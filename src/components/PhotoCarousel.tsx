import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './AppText';
import { brand } from '../theme/brand';
import { radius, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';

export type Slide = {
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
};

type Props = {
  slides: Slide[];
  height?: number;
  /** Сдвиг фото при прокрутке экрана (параллакс) */
  parallax?: Animated.AnimatedInterpolation<number>;
};

const SLIDE_MS = 5500;
const FADE_MS = 700;

/**
 * Баннер с фотографиями: слайды сменяются сами с плавным перетеканием, фото медленно приближается (эффект Кена Бёрнса),
 * снизу — точки-индикаторы. Нажатие на точку открывает нужный слайд. При «уменьшении движения» фото не двигается.
 */
export default function PhotoCarousel({ slides, height = 210, parallax }: Props) {
  const [index, setIndex] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));
  const [zoom] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => undefined);
  }, []);

  // Медленное приближение текущего фото
  useEffect(() => {
    if (reduceMotion) return;
    zoom.setValue(0);
    const animation = Animated.timing(zoom, { toValue: 1, duration: SLIDE_MS + FADE_MS, easing: Easing.linear, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [index, zoom, reduceMotion]);

  // Переход к слайду: старое фото гаснет, новое проявляется
  const goTo = useCallback(
    (next: number) => {
      if (reduceMotion) {
        setIndex(next);
        return;
      }
      Animated.timing(fade, { toValue: 0, duration: FADE_MS / 2, useNativeDriver: true }).start(() => {
        setIndex(next);
        Animated.timing(fade, { toValue: 1, duration: FADE_MS / 2, useNativeDriver: true }).start();
      });
    },
    [fade, reduceMotion],
  );

  // Автоматическая смена слайдов
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setTimeout(() => goTo((index + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, slides.length, goTo]);

  const slide = slides[index];
  if (!slide) return null;
  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1.2] });

  return (
    <View style={[styles.wrap, { height }]}>
      <Animated.Image
        source={slide.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={[styles.photo, { height: height + 80, opacity: fade, transform: [...(parallax ? [{ translateY: parallax }] : []), { scale }] }]}
      />
      <LinearGradient colors={brand.photoShade} style={StyleSheet.absoluteFill} />
      <View style={styles.frame} pointerEvents="none" />
      <Animated.View style={[styles.text, { opacity: fade }]}>
        <Text style={styles.title}>{slide.title}</Text>
        <View style={styles.rule} />
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((item, i) => (
            <Pressable key={item.title + i} onPress={() => i !== index && goTo(i)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${i + 1} / ${slides.length}`} accessibilityState={{ selected: i === index }}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: brand.navy,
  },
  photo: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    width: '100%',
  },
  frame: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderRadius: radius.lg - 8,
    borderColor: 'rgba(212, 183, 124, 0.5)',
  },
  text: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + 8,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 34,
    lineHeight: 38,
    color: brand.ivory,
  },
  rule: {
    width: 48,
    height: 1,
    backgroundColor: brand.gold,
  },
  subtitle: {
    fontFamily: fonts.greeting,
    fontSize: 15,
    lineHeight: 21,
    color: '#EDE3D2',
  },
  dots: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(248, 243, 232, 0.45)',
  },
  dotActive: {
    width: 18,
    backgroundColor: brand.gold,
  },
});
