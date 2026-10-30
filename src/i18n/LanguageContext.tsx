import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadLanguage, saveLanguage } from '../storage/storage';
import type { LocalizedText } from './localized';
import { Language, TranslationKey, translations } from './translations';

type Params = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Перевод строки интерфейса по ключу с подстановкой параметров */
  t: (key: TranslationKey, params?: Params) => string;
  /** Выбор нужного языка из данных */
  tr: (text: LocalizedText) => string;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLanguage().then((stored) => {
      if (cancelled) return;
      if (stored) setLanguageState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void saveLanguage(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Params) => {
      let text = translations[language][key];
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    },
    [language],
  );

  const tr = useCallback((text: LocalizedText) => text[language], [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, tr, ready }),
    [language, setLanguage, t, tr, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n должен использоваться внутри LanguageProvider');
  }
  return context;
}
