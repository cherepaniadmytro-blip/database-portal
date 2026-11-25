import { getMessages } from '../i18n/index.ts'
import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'
import { normStatus } from './records.ts'
import type { Role } from './types.ts'

export function roleLabel(role: Role, locale: Locale = DEFAULT_LOCALE): string {
  return getMessages(locale).roles[role]
}

export function sectionLabel(section: string | null | undefined, fallback?: string | null, locale: Locale = DEFAULT_LOCALE): string {
  const key = (section ?? '').trim()
  if (!key) return fallback?.trim() || getMessages(locale).dash
  return getMessages(locale).sections[key] ?? fallback?.trim() ?? key
}

export function recordStatusLabel(status: string | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  const norm = normStatus(status)
  if (!norm) return getMessages(locale).dash
  return getMessages(locale).recordStatuses[norm] ?? norm
}

export function visibilityLabel(value: string, locale: Locale = DEFAULT_LOCALE): string {
  const t = getMessages(locale)
  if (value === 'public' || value === 'partner' || value === 'owner') return t.visibility[value]
  return value
}

export function accessLabel(level: string | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  const key = (level ?? '').toUpperCase()
  const t = getMessages(locale)
  if (key === 'PUBLIC' || key === 'PARTNER' || key === 'PRIVATE') return t.access[key]
  return level?.trim() ? level : t.dash
}

export function changeTypeLabel(value: string | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  const key = (value ?? '').toUpperCase()
  const t = getMessages(locale)
  if (key === 'INSERT' || key === 'UPDATE' || key === 'DELETE') return t.changeType[key]
  return value?.trim() ? value : t.dash
}

export function reportTypeLabel(value: string | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  const key = (value ?? '').toLowerCase()
  const t = getMessages(locale)
  if (key === 'daily' || key === 'weekly' || key === 'monthly') return t.reportType[key]
  return value?.trim() ? value : t.reportType.fallback
}

export function syncStatusLabel(value: string | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  const key = (value ?? '').toLowerCase()
  const t = getMessages(locale)
  if (key === 'ok' || key === 'error' || key === 'running' || key === 'never') return t.syncStatus[key]
  return value?.trim() ? value : t.dash
}
