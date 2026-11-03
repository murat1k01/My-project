import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError, setAuthToken, setUnauthorizedHandler } from '../api/client';
import type { ProfileDraft, SubscriptionInfo, User } from '../api/types';
import { clearToken, loadToken, saveToken } from '../storage/tokenStore';
import { clearCachedUser, loadCachedUser, saveCachedUser } from '../storage/storage';

export type RegisterData = ProfileDraft & { contact: string; password: string; passwordConfirm: string };

type AuthResponse = { token: string; user: User };

type AuthContextValue = {
  /** true, когда проверка сохранённой сессии завершена */
  ready: boolean;
  user: User | null;
  subscription: SubscriptionInfo;
  isAdmin: boolean;
  signIn: (contact: string, password: string, remember: boolean) => Promise<void>;
  /** onCreated вызывается, когда аккаунт создан, но приложение ещё не открылось: чтобы показать сообщение об успехе */
  register: (data: RegisterData, onCreated?: () => Promise<void>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (draft: ProfileDraft) => Promise<void>;
  /** Заново запрашивает профиль и подписку с сервера */
  refresh: () => Promise<void>;
};

const FREE: SubscriptionInfo = { plan: 'free', status: 'none', expiresAt: null, previousPlan: null };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(FREE);
  // false при входе без «Запомнить меня»: тогда на устройстве ничего не остаётся
  const persist = useRef(true);

  const forget = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setSubscription(FREE);
    persist.current = true;
    await Promise.all([clearToken(), clearCachedUser()]);
  }, []);

  const refresh = useCallback(async () => {
    const me = await api<{ user: User; subscription: SubscriptionInfo }>('GET', '/api/me');
    setUser(me.user);
    setSubscription(me.subscription);
    if (persist.current) await saveCachedUser(me.user);
  }, []);

  // Восстановление сессии при запуске
  useEffect(() => {
    let cancelled = false;
    setUnauthorizedHandler(() => void forget());

    async function restore() {
      const token = await loadToken();
      if (!token) {
        if (!cancelled) setReady(true);
        return;
      }
      setAuthToken(token);
      // Показываем сохранённый профиль сразу, поэтому запуск не ждёт сеть и работает без интернета
      const cached = await loadCachedUser();
      if (cancelled) return;
      if (cached) setUser(cached);
      setReady(true);
      try {
        await refresh();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await forget();
      }
    }

    void restore();
    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [forget, refresh]);

  const accept = useCallback(
    async (response: AuthResponse, remember: boolean) => {
      persist.current = remember;
      setAuthToken(response.token);
      setUser(response.user);
      // Без «Запомнить меня» токен живёт только в памяти до закрытия приложения
      if (remember) {
        await saveToken(response.token);
        await saveCachedUser(response.user);
      }
      await refresh().catch(() => undefined);
    },
    [refresh],
  );

  const signIn = useCallback(
    async (contact: string, password: string, remember: boolean) => {
      const response = await api<AuthResponse>('POST', '/api/auth/login', { contact, password, remember });
      await accept(response, remember);
    },
    [accept],
  );

  const register = useCallback(
    async (data: RegisterData, onCreated?: () => Promise<void>) => {
      const response = await api<AuthResponse>('POST', '/api/auth/register', data);
      await onCreated?.();
      await accept(response, true);
    },
    [accept],
  );

  const signOut = useCallback(async () => {
    await api('POST', '/api/auth/logout').catch(() => undefined);
    await forget();
  }, [forget]);

  const updateProfile = useCallback(async (draft: ProfileDraft) => {
    const response = await api<{ user: User }>('PUT', '/api/me', draft);
    setUser(response.user);
    if (persist.current) await saveCachedUser(response.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ready, user, subscription, isAdmin: user?.role === 'admin', signIn, register, signOut, updateProfile, refresh }),
    [ready, user, subscription, signIn, register, signOut, updateProfile, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return context;
}
