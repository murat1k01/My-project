import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadFavorites, saveFavorites } from '../storage/storage';
import type { ServiceId } from '../types/Service';

/**
 * Избранные разделы на главной. Хранятся на устройстве.
 * Запись выполняется прямо в обработчике, а текущее значение лежит в ref,
 * поэтому быстрые повторные нажатия не теряют изменения.
 */
type AppDataContextValue = {
  ready: boolean;
  favorites: ServiceId[];
  isFavorite: (id: ServiceId) => boolean;
  toggleFavorite: (id: ServiceId) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [favorites, setFavorites] = useState<ServiceId[]>([]);
  const favoritesRef = useRef<ServiceId[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadFavorites()
      .then((stored) => {
        if (cancelled) return;
        favoritesRef.current = stored;
        setFavorites(stored);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback((id: ServiceId) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: ServiceId) => {
    const current = favoritesRef.current;
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    favoritesRef.current = next;
    setFavorites(next);
    void saveFavorites(next);
  }, []);

  const value = useMemo<AppDataContextValue>(() => ({ ready, favorites, isFavorite, toggleFavorite }), [ready, favorites, isFavorite, toggleFavorite]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData должен использоваться внутри AppDataProvider');
  }
  return context;
}
