import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translations, type Locale, localeLabels } from '../i18n/translations';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'squadkeeper-locale';

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'uk' || stored === 'en') return stored;
  return 'en';
}

function resolveKey(locale: Locale, key: string): string | undefined {
  const segments = key.split('.');
  let current: unknown = translations[locale];
  for (const segment of segments) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

const defaultI18n: I18nContextValue = {
  locale: 'en',
  setLocale: () => undefined,
  t: (key, vars) => {
    const value = resolveKey('en', key) ?? key;
    return interpolate(value, vars);
  },
};

const I18nContext = createContext<I18nContextValue>(defaultI18n);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nextLocale);
    }
  };

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const value = resolveKey(locale, key) ?? resolveKey('en', key) ?? key;
      return interpolate(value, vars);
    };
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function getLocaleCode(locale: Locale): string {
  return locale === 'uk' ? 'uk-UA' : 'en-US';
}

export function getLocaleLabel(locale: Locale): string {
  return localeLabels[locale];
}
