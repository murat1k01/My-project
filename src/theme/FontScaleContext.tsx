import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadFontScale, saveFontScale } from '../storage/storage';

/** Границы ползунка «Размер текста»: 85–140 % от стандартного размера */
export const FONT_SCALE_MIN = 0.85;
export const FONT_SCALE_MAX = 1.4;
export const FONT_SCALE_STEP = 0.05;

/** Масштаб всегда кратен шагу ползунка и не выходит за границы */
export function normalizeFontScale(value: number): number {
  const stepped = Math.round(value / FONT_SCALE_STEP) * FONT_SCALE_STEP;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Number(stepped.toFixed(2))));
}

type FontScaleContextValue = {
  scale: number;
  setScale: (value: number) => void;
  ready: boolean;
};

const FontScaleContext = createContext<FontScaleContextValue>({ scale: 1, setScale: () => undefined, ready: true });

/** Хранит выбранный размер текста. Его применяют компоненты Text и TextInput из components/AppText. */
export function FontScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFontScale().then((stored) => {
      if (cancelled) return;
      if (stored !== null) setScaleState(normalizeFontScale(stored));
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setScale = useCallback((value: number) => {
    const next = normalizeFontScale(value);
    setScaleState(next);
    void saveFontScale(next);
  }, []);

  const value = useMemo(() => ({ scale, setScale, ready }), [scale, setScale, ready]);
  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}

export const useFontScale = () => useContext(FontScaleContext);
