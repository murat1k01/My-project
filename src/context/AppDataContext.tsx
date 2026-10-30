import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearSession,
  loadFavorites,
  loadSession,
  loadStudents,
  saveFavorites,
  saveSession,
  saveStudents,
} from '../storage/storage';
import type { ServiceId } from '../types/Service';
import type { Session } from '../types/Session';
import type { Student, StudentDraft } from '../types/Student';
import { createId } from '../utils/format';

/**
 * Общие данные приложения: учебная сессия, студенты, избранное.
 *
 * Как избегаем гонок с AsyncStorage:
 * 1. Все данные читаются один раз при запуске (`ready` = false, пока чтение идёт).
 * 2. Интерфейс показывается только после чтения, поэтому пустой список
 *    не может перезаписать сохранённые данные.
 * 3. Запись выполняется прямо в обработчиках действий, а текущее значение
 *    хранится в ref — быстрые повторные нажатия не теряют изменения.
 */
type AppDataContextValue = {
  ready: boolean;
  session: Session | null;
  /** Возвращает false, если сессию не удалось сохранить на устройстве */
  signIn: (login: string) => Promise<boolean>;
  signOut: () => Promise<void>;

  students: Student[];
  addStudent: (draft: StudentDraft) => Promise<boolean>;
  removeStudent: (id: string) => Promise<boolean>;
  getStudent: (id: string) => Student | undefined;

  favorites: ServiceId[];
  isFavorite: (id: ServiceId) => boolean;
  toggleFavorite: (id: ServiceId) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [favorites, setFavorites] = useState<ServiceId[]>([]);

  const studentsRef = useRef<Student[]>([]);
  const favoritesRef = useRef<ServiceId[]>([]);

  // Первоначальная загрузка всех данных
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [storedSession, storedStudents, storedFavorites] = await Promise.all([
          loadSession(),
          loadStudents(),
          loadFavorites(),
        ]);
        if (cancelled) return;

        studentsRef.current = storedStudents;
        favoritesRef.current = storedFavorites;
        setStudents(storedStudents);
        setFavorites(storedFavorites);
        setSession(storedSession);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Авторизация ----------

  const signIn = useCallback(async (login: string) => {
    const nextSession: Session = { login, signedInAt: new Date().toISOString() };
    const saved = await saveSession(nextSession);
    setSession(nextSession);
    return saved;
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  // ---------- Студенты ----------

  const commitStudents = useCallback((next: Student[]) => {
    studentsRef.current = next;
    setStudents(next);
    return saveStudents(next);
  }, []);

  const addStudent = useCallback(
    (draft: StudentDraft) => {
      const student: Student = { ...draft, id: createId(), createdAt: new Date().toISOString() };
      return commitStudents([student, ...studentsRef.current]);
    },
    [commitStudents],
  );

  const removeStudent = useCallback(
    (id: string) => commitStudents(studentsRef.current.filter((student) => student.id !== id)),
    [commitStudents],
  );

  const getStudent = useCallback((id: string) => students.find((student) => student.id === id), [students]);

  // ---------- Избранное ----------

  const isFavorite = useCallback((id: ServiceId) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: ServiceId) => {
    const current = favoritesRef.current;
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    favoritesRef.current = next;
    setFavorites(next);
    void saveFavorites(next);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      session,
      signIn,
      signOut,
      students,
      addStudent,
      removeStudent,
      getStudent,
      favorites,
      isFavorite,
      toggleFavorite,
    }),
    [ready, session, signIn, signOut, students, addStudent, removeStudent, getStudent, favorites, isFavorite, toggleFavorite],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData должен использоваться внутри AppDataProvider');
  }
  return context;
}
