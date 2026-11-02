import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '../api/client';

export type ApiState<T> = {
  data: T | null;
  loading: boolean;
  /** Текст ошибки; уже загруженные данные при этом остаются доступны */
  error: string | null;
  reload: () => Promise<void>;
};

/** Загружает данные с сервера. Если path = null, запрос не выполняется. */
export function useApi<T>(path: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);
  // Ответ на устаревший запрос (например, при быстром вводе в поиске) игнорируется
  const latest = useRef(0);

  const reload = useCallback(async () => {
    if (path === null) {
      setLoading(false);
      return;
    }
    const id = ++latest.current;
    setLoading(true);
    try {
      const result = await api<T>('GET', path);
      if (id === latest.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === latest.current) setError(errorMessage(e));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    // Запуск загрузки при открытии экрана: это и есть синхронизация с внешним источником
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
