import { useCallback, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { notify } from '../utils/dialogs';

export type FavoriteKind = 'book' | 'dish' | 'route' | 'stop';

/** Избранное пользователя на сервере. Лимиты тарифа проверяет сервер, здесь только показываем его ответ. */
export function useFavorites(kind: FavoriteKind) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [stored, setItems] = useState<string[]>([]);
  const items = user ? stored : [];
  // При возврате на экран обновляем список: отметку могли изменить на экране подробностей
  const focused = useIsFocused();

  useEffect(() => {
    let cancelled = false;
    if (!user || !focused) return;
    api<{ items: string[] }>('GET', `/api/favorites/${kind}`)
      .then((r) => {
        if (!cancelled) setItems(r.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [focused, kind, user]);

  const toggle = useCallback(
    async (id: string) => {
      const path = `/api/favorites/${kind}/${encodeURIComponent(id)}`;
      const isFavorite = stored.includes(id);
      try {
        await api(isFavorite ? 'DELETE' : 'PUT', path);
        setItems((prev) => (isFavorite ? prev.filter((x) => x !== id) : [id, ...prev]));
      } catch (e) {
        notify(t('errorTitle'), errorMessage(e));
      }
    },
    [stored, kind, t],
  );

  return { items, isFavorite: (id: string) => items.includes(id), toggle };
}
