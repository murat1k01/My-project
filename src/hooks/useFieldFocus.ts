import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Отслеживает, что фокус находится в одном из связанных полей (например, «Пароль» и «Повторите пароль»).
 * Уход из поля учитывается с небольшой задержкой, чтобы подсказка не мигала при переходе между полями.
 */
export function useFieldFocus() {
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onFocus = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setFocused(true);
  }, []);

  const onBlur = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFocused(false), 150);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { focused, onFocus, onBlur };
}
