import { useLocale } from '../context/LocaleContext.tsx'
import { LOCALE_META } from '../i18n/locales.ts'

export function LanguageSwitcher() {
  const { locale, setLocale, locales, t } = useLocale()

  return (
    <div className="lang-switch" role="group" aria-label={t.language}>
      {locales.map((code) => {
        const meta = LOCALE_META[code]
        const active = code === locale
        return (
          <button
            key={code}
            type="button"
            className={active ? 'lang-btn active' : 'lang-btn'}
            aria-pressed={active}
            title={meta.nativeName}
            onClick={() => setLocale(code)}
          >
            {meta.shortName}
          </button>
        )
      })}
    </div>
  )
}
