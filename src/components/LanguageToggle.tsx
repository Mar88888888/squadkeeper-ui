import { useI18n, getLocaleLabel } from '../contexts/I18nContext';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === 'en' ? 'uk' : 'en';

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label={t('language.switchTo', { language: getLocaleLabel(nextLocale) })}
      title={t('language.switchTo', { language: getLocaleLabel(nextLocale) })}
    >
      <span className="text-xs font-bold tracking-wide">{locale.toUpperCase()}</span>
    </button>
  );
}

