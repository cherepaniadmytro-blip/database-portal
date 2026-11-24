import type {
  DateField,
  FieldDef,
  FilterState,
  HistoryRow,
  RecordRow,
  Role,
  SortDir,
  SortKey,
  StatusTone,
  SyncRow,
} from './types.ts'

export const TIMEZONE = 'Europe/Bratislava'
export const JOBS_SECTION = 'Jobs & Freelance'
export const PARTNERS_SECTION = 'Partners'
export const OPPORTUNITIES_SECTION = 'Business Opportunities'

export const EMPTY_FILTERS: FilterState = {
  q: '',
  status: '',
  priority: '',
  country: '',
  category: '',
  dateField: 'date_added',
  dateFrom: '',
  dateTo: '',
}

export const FIELDS: FieldDef[] = [
  { key: 'id', label: 'ID', kind: 'text' },
  { key: 'name', label: 'Назва', kind: 'text' },
  { key: 'category', label: 'Розділ', kind: 'text' },
  { key: 'sheet_category', label: 'Категорія аркуша', kind: 'text' },
  { key: 'subcategory', label: 'Підкатегорія', kind: 'text' },
  { key: 'short_description', label: 'Короткий опис', kind: 'text' },
  { key: 'organization', label: 'Організація', kind: 'text' },
  { key: 'country', label: 'Країна', kind: 'text' },
  { key: 'city_region', label: 'Місто / регіон', kind: 'text' },
  { key: 'language_community', label: 'Мова / спільнота', kind: 'text' },
  { key: 'status', label: 'Статус', kind: 'text' },
  { key: 'priority', label: 'Пріоритет', kind: 'text' },
  { key: 'potential', label: 'Потенціал', kind: 'number' },
  { key: 'reliability', label: 'Надійність', kind: 'number' },
  { key: 'skill_fit', label: 'Відповідність навичок', kind: 'number' },
  { key: 'access_level', label: 'Рівень доступу', kind: 'text' },
  { key: 'partner_type', label: 'Тип партнера', kind: 'text' },
  { key: 'date_added', label: 'Дата додавання', kind: 'date' },
  { key: 'last_updated', label: 'Останнє оновлення', kind: 'date' },
  { key: 'last_verified', label: 'Остання перевірка', kind: 'date' },
  { key: 'published_date', label: 'Дата публікації', kind: 'date' },
  { key: 'synced_at', label: 'Синхронізовано', kind: 'datetime' },
  { key: 'website', label: 'Вебсайт', kind: 'link' },
  { key: 'source_url', label: 'URL джерела', kind: 'link' },
  { key: 'details_link', label: 'Посилання на деталі', kind: 'link' },
  { key: 'source', label: 'Джерело', kind: 'text' },
  { key: 'public_contact', label: 'Публічний контакт', kind: 'text' },
  { key: 'next_action', label: 'Наступна дія', kind: 'text' },
  { key: 'responsible_agent', label: 'Відповідальний', kind: 'text' },
  { key: 'pay_budget', label: 'Оплата / бюджет', kind: 'text' },
  { key: 'requirements', label: 'Вимоги', kind: 'text' },
  { key: 'hours_format', label: 'Формат / години', kind: 'text' },
  { key: 'notes', label: 'Нотатки', kind: 'text' },
  { key: 'duplicate_check', label: 'Перевірка дублікатів', kind: 'text' },
  { key: 'sheet_row', label: 'Рядок аркуша', kind: 'number' },
]

const SEARCH_KEYS: (keyof RecordRow)[] = [
  'id',
  'name',
  'category',
  'sheet_category',
  'subcategory',
  'short_description',
  'organization',
  'country',
  'city_region',
  'language_community',
  'website',
  'public_contact',
  'source',
  'source_url',
  'status',
  'priority',
  'partner_type',
  'next_action',
  'responsible_agent',
  'notes',
  'access_level',
]

const haystacks = new WeakMap<RecordRow, string>()

export function todayISO(now = new Date(), timeZone = TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function parseDay(value: string | null | undefined): string | null {
  if (!value) return null
  const s = value.trim()
  let match = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (match) {
    const day = `${match[1]}-${match[2]}-${match[3]}`
    return isRealDay(day) ? day : null
  }
  match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s)
  if (match) {
    const day = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
    return isRealDay(day) ? day : null
  }
  return null
}

function isRealDay(iso: string): boolean {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function formatDay(value: string | null | undefined): string {
  const day = parseDay(value)
  if (!day) return value?.trim() ? value.trim() : '—'
  const [year, month, date] = day.split('-')
  return `${date}.${month}.${year}`
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDay(value)
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('uk-UA').format(value)
}

export function formatMaybeNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(value)
}

export function normStatus(status: string | null | undefined): string {
  return (status ?? '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function statusTone(status: string | null | undefined): StatusTone {
  switch (normStatus(status)) {
    case 'VERIFIED':
    case 'ACTIVE':
    case 'COMPLETED':
      return 'green'
    case 'NEW':
      return 'blue'
    case 'NEEDS REVIEW':
      return 'yellow'
    case 'IN PROGRESS':
    case 'CONTACTED':
    case 'WAITING':
      return 'orange'
    case 'EXPIRED':
      return 'red'
    case 'ARCHIVED':
      return 'grey'
    default:
      return status?.trim() ? 'neutral' : 'neutral'
  }
}

export function isArchiveStatus(status: string | null | undefined): boolean {
  const normalized = normStatus(status)
  return normalized === 'ARCHIVED' || normalized === 'EXPIRED'
}

export function priorityWeight(priority: string | null | undefined): number {
  if (!priority) return 0
  const raw = priority.trim().toUpperCase()
  const ranked = /^P\s*(\d+)$/.exec(raw)
  if (ranked) return Math.max(0, 6 - Number(ranked[1]))
  const named: Record<string, number> = {
    CRITICAL: 6,
    URGENT: 6,
    HIGH: 5,
    MEDIUM: 3,
    LOW: 1,
  }
  if (raw in named) return named[raw] ?? 0
  const numeric = Number(raw.replace(',', '.'))
  return Number.isFinite(numeric) ? numeric : 0
}

export function rankScore(row: RecordRow): number {
  const potential = typeof row.potential === 'number' ? row.potential : 0
  return priorityWeight(row.priority) * 10 + potential
}

export function isNewToday(row: RecordRow, today: string): boolean {
  return parseDay(row.date_added) === today
}

export function isUpdatedToday(row: RecordRow, today: string): boolean {
  const updated = parseDay(row.last_updated)
  const added = parseDay(row.date_added)
  return updated === today && added !== today
}

export function rowFreshness(row: RecordRow, today: string): 'new' | 'updated' | null {
  if (isNewToday(row, today)) return 'new'
  if (isUpdatedToday(row, today)) return 'updated'
  return null
}

export function isFreshInSection(row: RecordRow, section: string, today: string): boolean {
  if (row.category !== section) return false
  return normStatus(row.status) === 'NEW' || isNewToday(row, today)
}

export type DashboardCounts = {
  total: number
  newToday: number
  updatedToday: number
  newJobs: number
  newPartners: number
  newOpportunities: number
}

export function dashboardCounts(rows: RecordRow[], today = todayISO()): DashboardCounts {
  let newToday = 0
  let updatedToday = 0
  let newJobs = 0
  let newPartners = 0
  let newOpportunities = 0
  for (const row of rows) {
    if (isNewToday(row, today)) newToday += 1
    if (isUpdatedToday(row, today)) updatedToday += 1
    if (isFreshInSection(row, JOBS_SECTION, today)) newJobs += 1
    if (isFreshInSection(row, PARTNERS_SECTION, today)) newPartners += 1
    if (isFreshInSection(row, OPPORTUNITIES_SECTION, today)) newOpportunities += 1
  }
  return {
    total: rows.length,
    newToday,
    updatedToday,
    newJobs,
    newPartners,
    newOpportunities,
  }
}

export function topRecords(rows: RecordRow[], limit = 10): RecordRow[] {
  return [...rows]
    .sort((a, b) => {
      const byScore = rankScore(b) - rankScore(a)
      if (byScore) return byScore
      const byReliability = (b.reliability ?? -1) - (a.reliability ?? -1)
      if (byReliability) return byReliability
      return a.name.localeCompare(b.name, 'uk')
    })
    .slice(0, limit)
}

export function canSeeSection(visibleTo: string, role: Role): boolean {
  if (role === 'owner') return true
  if (role === 'partner') return visibleTo === 'public' || visibleTo === 'partner'
  return role === 'public' && visibleTo === 'public'
}

export function recordHaystack(row: RecordRow): string {
  const cached = haystacks.get(row)
  if (cached) return cached
  const text = SEARCH_KEYS.map((key) => {
    const value = row[key]
    return value == null ? '' : String(value)
  })
    .join('\n')
    .toLowerCase()
  haystacks.set(row, text)
  return text
}

export function scopeRecords(
  rows: RecordRow[],
  opts: { category?: string; archiveOnly?: boolean },
): RecordRow[] {
  return rows.filter((row) => {
    if (opts.category && row.category !== opts.category) return false
    if (opts.archiveOnly && !isArchiveStatus(row.status)) return false
    return true
  })
}

export function applyFilters(rows: RecordRow[], filters: FilterState): RecordRow[] {
  const query = filters.q.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.category && row.category !== filters.category) return false
    if (filters.status && normStatus(row.status) !== normStatus(filters.status)) return false
    if (filters.priority && (row.priority ?? '') !== filters.priority) return false
    if (filters.country && (row.country ?? '') !== filters.country) return false
    if (query && !recordHaystack(row).includes(query)) return false
    if (filters.dateFrom || filters.dateTo) {
      const day = parseDay(row[filters.dateField])
      if (!day) return false
      if (filters.dateFrom && day < filters.dateFrom) return false
      if (filters.dateTo && day > filters.dateTo) return false
    }
    return true
  })
}

export function uniqueValues(
  rows: RecordRow[],
  key: 'status' | 'priority' | 'country' | 'category',
): string[] {
  const values = new Set<string>()
  for (const row of rows) {
    const value = row[key]
    if (value) values.add(value)
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'uk'))
}

function stringField(row: RecordRow, key: SortKey): string {
  if (key === 'score' || key === 'potential' || key === 'priority') return ''
  if (key === 'date_added' || key === 'last_updated') return ''
  const value = row[key]
  return value == null ? '' : String(value)
}

export function sortRecords(rows: RecordRow[], key: SortKey, dir: SortDir): RecordRow[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const compared = compareSort(a, b, key)
    if (compared) return compared * sign
    return a.name.localeCompare(b.name, 'uk')
  })
}

function compareSort(a: RecordRow, b: RecordRow, key: SortKey): number {
  if (key === 'potential') return (a.potential ?? Number.NEGATIVE_INFINITY) - (b.potential ?? Number.NEGATIVE_INFINITY)
  if (key === 'priority') return priorityWeight(a.priority) - priorityWeight(b.priority)
  if (key === 'score') return rankScore(a) - rankScore(b)
  if (key === 'date_added' || key === 'last_updated') {
    const left = parseDay(a[key]) ?? ''
    const right = parseDay(b[key]) ?? ''
    if (left === right) return 0
    return left < right ? -1 : 1
  }
  return stringField(a, key).localeCompare(stringField(b, key), 'uk', { sensitivity: 'base' })
}

export function latestSync(rows: SyncRow[]): SyncRow | null {
  const master = rows.find((row) => row.source === 'master_database' && row.last_success_at)
  if (master) return master
  const stamped = rows.filter((row) => row.last_success_at)
  stamped.sort((a, b) => (a.last_success_at! < b.last_success_at! ? 1 : -1))
  return stamped[0] ?? null
}

export function compareHistory(a: HistoryRow, b: HistoryRow): number {
  if (a.changed_at !== b.changed_at) return a.changed_at < b.changed_at ? 1 : -1
  return b.id - a.id
}

export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString()
    return null
  } catch {
    return null
  }
}

export function csvFilename(prefix: string, today = todayISO()): string {
  const slug = prefix
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `database-${slug || 'records'}-${today}.csv`
}

export function decodeParam(value: string | undefined): string {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function isDateField(value: string): value is DateField {
  return value === 'date_added' || value === 'last_updated' || value === 'last_verified'
}
