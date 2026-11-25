import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMessages, type Messages } from '../i18n/index.ts'
import { DEFAULT_LOCALE, LOCALES, LOCALE_META, STORAGE_KEY, isLocale, readStoredLocale, type Locale } from '../i18n/locales.ts'

type LocaleValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  locales: readonly Locale[]
  t: Messages
  meta: (typeof LOCALE_META)[Locale]
}

const LocaleContext = createContext<LocaleValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  useEffect(() => {
    document.documentElement.setAttribute('lang', LOCALE_META[locale].htmlLang)
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* private mode */
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return
    setLocaleState(next)
  }, [])

  const value = useMemo<LocaleValue>(
    () => ({
      locale,
      setLocale,
      locales: LOCALES,
      t: getMessages(locale),
      meta: LOCALE_META[locale],
    }),
    [locale, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used within LocaleProvider')
  return value
}

export function useT(): Messages {
  return useLocale().t
}

export { DEFAULT_LOCALE }
