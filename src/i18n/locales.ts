/** Supported UI locales. Add a code here, then a messages file, to introduce a language. */
export const LOCALES = ['uk', 'sk'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'uk'

export const STORAGE_KEY = 'database-portal-locale'

export const LOCALE_META: Record<Locale, { nativeName: string; shortName: string; htmlLang: string }> = {
  uk: { nativeName: 'Українська', shortName: 'UK', htmlLang: 'uk' },
  sk: { nativeName: 'Slovenčina', shortName: 'SK', htmlLang: 'sk' },
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value)
}

export function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    /* private mode */
  }
  return DEFAULT_LOCALE
}
