import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadCampus, saveCampus } from '../storage/storage';
import { CampusState, EMPTY_CAMPUS_STATE } from '../types/Campus';

/**
 * Состояние всех сервисов кампуса (брони, заказы, абонемент, заявки).
 * Как и AppDataContext: читаем один раз при запуске, пишем сразу при изменении,
 * актуальное значение держим в ref, чтобы быстрые нажатия не теряли изменения.
 */
type CampusContextValue = {
  ready: boolean;
  campus: CampusState;
  /** Изменяет состояние через функцию (prev → next) и сохраняет его */
  updateCampus: (updater: (prev: CampusState) => CampusState) => void;
};

const CampusContext = createContext<CampusContextValue | null>(null);

export function CampusProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [campus, setCampus] = useState<CampusState>(EMPTY_CAMPUS_STATE);
  const campusRef = useRef<CampusState>(EMPTY_CAMPUS_STATE);

  useEffect(() => {
    let cancelled = false;
    loadCampus().then((stored) => {
      if (cancelled) return;
      campusRef.current = stored;
      setCampus(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateCampus = useCallback((updater: (prev: CampusState) => CampusState) => {
    const next = updater(campusRef.current);
    campusRef.current = next;
    setCampus(next);
    void saveCampus(next);
  }, []);

  const value = useMemo(() => ({ ready, campus, updateCampus }), [ready, campus, updateCampus]);

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>;
}

export function useCampus(): CampusContextValue {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error('useCampus должен использоваться внутри CampusProvider');
  }
  return context;
}
