import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/** Если в системе включено «Уменьшить движение», элементы появляются сразу, без анимации. */
let reduceMotion = false;
void AccessibilityInfo.isReduceMotionEnabled()
  .then((value) => {
    reduceMotion = value;
  })
  .catch(() => undefined);
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => {
  reduceMotion = value;
});

// Карточки, появившиеся почти одновременно (на одном экране), выезжают по очереди
let lastMount = 0;
let order = 0;
const STEP_MS = 55;
const MAX_DELAY_MS = 330;

/**
 * Плавное появление элемента: прозрачность 0 → 1 и сдвиг снизу вверх.
 * Возвращает стиль для Animated.View.
 */
export function useAppear(distance = 14) {
  const [value] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(1);
      return;
    }
    const now = Date.now();
    order = now - lastMount < 120 ? order + 1 : 0;
    lastMount = now;
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 380,
      delay: Math.min(order * STEP_MS, MAX_DELAY_MS),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [value]);

  return {
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  };
}
