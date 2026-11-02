import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadFontScale, saveFontScale } from '../storage/storage';

export type FontScaleId = 'small' | 'standard' | 'large' | 'xlarge';

export const FONT_SCALES: Record<FontScaleId, number> = {
  small: 0.88,
  standard: 1,
  large: 1.15,
  xlarge: 1.3,
};

type FontScaleContextValue = {
  scaleId: FontScaleId;
  scale: number;
  setScaleId: (id: FontScaleId) => void;
  ready: boolean;
};

const FontScaleContext = createContext<FontScaleContextValue>({ scaleId: 'standard', scale: 1, setScaleId: () => undefined, ready: true });

/** Хранит выбранный размер текста. Его применяют компоненты Text и TextInput из components/AppText. */
export function FontScaleProvider({ children }: { children: ReactNode }) {
  const [scaleId, setScaleState] = useState<FontScaleId>('standard');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFontScale().then((stored) => {
      if (cancelled) return;
      if (stored) setScaleState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setScaleId = useCallback((id: FontScaleId) => {
    setScaleState(id);
    void saveFontScale(id);
  }, []);

  const value = useMemo(() => ({ scaleId, scale: FONT_SCALES[scaleId], setScaleId, ready }), [scaleId, setScaleId, ready]);
  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}

export const useFontScale = () => useContext(FontScaleContext);
