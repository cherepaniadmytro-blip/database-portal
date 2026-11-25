export type CatalogFilters = {
  q: string
  city: string
  country: string
  status: string
  category: string
}

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  q: '',
  city: '',
  country: '',
  status: '',
  category: '',
}

export type CatalogStep =
  | { kind: 'groups' }
  | { kind: 'platforms'; group: string }
  | { kind: 'list'; group: string; platform: string; filters: CatalogFilters }
  | { kind: 'detail'; group: string; platform: string; id: string; filters: CatalogFilters }

const AUTH_KEYS = ['access_token', 'refresh_token', 'provider_token', 'error', 'error_code', 'error_description']

export function isAuthHash(hash: string): boolean {
  const body = hash.replace(/^#/, '')
  if (!body || body.startsWith('/')) return false
  const params = new URLSearchParams(body)
  return AUTH_KEYS.some((key) => params.has(key))
}

function decodePart(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function readFilters(params: URLSearchParams): CatalogFilters {
  return {
    q: params.get('q') ?? '',
    city: params.get('city') ?? '',
    country: params.get('country') ?? '',
    status: params.get('status') ?? '',
    category: params.get('category') ?? '',
  }
}

function writeFilters(filters: CatalogFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.city) params.set('city', filters.city)
  if (filters.country) params.set('country', filters.country)
  if (filters.status) params.set('status', filters.status)
  if (filters.category) params.set('category', filters.category)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function parseCatalogHash(hash: string): CatalogStep {
  if (isAuthHash(hash)) return { kind: 'groups' }
  const body = hash.replace(/^#/, '')
  const qIndex = body.indexOf('?')
  const path = qIndex === -1 ? body : body.slice(0, qIndex)
  const query = qIndex === -1 ? '' : body.slice(qIndex + 1)
  const filters = readFilters(new URLSearchParams(query))
  const parts = path.split('/').filter(Boolean).map(decodePart)
  if (parts.length === 0) return { kind: 'groups' }
  if (parts[0] !== 'g' || !parts[1]) return { kind: 'groups' }
  const group = parts[1]
  if (parts.length === 2) return { kind: 'platforms', group }
  if (parts[2] !== 'p' || !parts[3]) return { kind: 'groups' }
  const platform = parts[3]
  if (parts.length === 4) return { kind: 'list', group, platform, filters }
  if (parts[4] === 'r' && parts[5]) return { kind: 'detail', group, platform, id: parts[5], filters }
  return { kind: 'groups' }
}

export function buildCatalogHash(step: CatalogStep): string {
  if (step.kind === 'groups') return '#/'
  const group = encodeURIComponent(step.group)
  if (step.kind === 'platforms') return `#/g/${group}`
  const platform = encodeURIComponent(step.platform)
  const filters = writeFilters(step.filters)
  if (step.kind === 'list') return `#/g/${group}/p/${platform}${filters}`
  return `#/g/${group}/p/${platform}/r/${encodeURIComponent(step.id)}${filters}`
}

export function replaceCatalogHash(hash: string): void {
  const next = hash.startsWith('#') ? hash : `#${hash}`
  if (window.location.hash === next) return
  const url = `${window.location.pathname}${window.location.search}${next}`
  window.history.replaceState(null, '', url)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
