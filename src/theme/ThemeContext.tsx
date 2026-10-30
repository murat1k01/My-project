import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadTheme, saveTheme } from '../storage/storage';
import { palettes, ThemeColors, ThemeMode } from './colors';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  /** true, когда сохранённая тема прочитана из AsyncStorage */
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // По умолчанию — фирменная тёмная тема; сохранённый выбор пользователя загружается ниже.
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTheme().then((stored) => {
      if (cancelled) return;
      if (stored) setModeState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void saveTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, isDark: mode === 'dark', colors: palettes[mode], ready, setMode, toggleTheme }),
    [mode, ready, setMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }
  return context;
}
