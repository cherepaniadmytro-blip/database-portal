import { createClient } from '@supabase/supabase-js'
import { appRedirectUrl } from './redirect.ts'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Задайте VITE_SUPABASE_URL і VITE_SUPABASE_PUBLISHABLE_KEY. Див. .env.example.')
}

// GoTrue hides the Postgres trigger text when X-Supabase-Api-Version is set,
// and answers uninvited sign-ups with "Database error saving new user".
// Without that header the same request returns "Sign-up is invite-only".
function fetchAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const target = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (!target.includes('/auth/v1/')) return fetch(input, init)
  const headers = new Headers(init?.headers)
  headers.delete('x-supabase-api-version')
  return fetch(input, { ...init, headers })
}

// Publishable key only. Row Level Security decides what each session can read.
export const supabase = createClient(url, key, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'database-portal-auth',
  },
  global: { fetch: fetchAuth },
})

/** Magic-link return URL: this deployment's origin plus the app base path. */
export function authRedirectTo(): string {
  return appRedirectUrl(window.location.origin, import.meta.env.BASE_URL || '/')
}

export function isInviteOnlyError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false
  const message = (error.message ?? '').toLowerCase()
  return (
    error.code === 'P0001' ||
    message.includes('invite-only') ||
    message.includes('database error saving new user')
  )
}

type PageResult<T> = { data: T[] | null; error: { message: string } | null }

export async function fetchAll<T>(
  make: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const size = 1000
  const all: T[] = []
  for (let from = 0; from < 50000; from += size) {
    const { data, error } = await make(from, from + size - 1)
    if (error) throw new Error(error.message)
    const chunk = data ?? []
    all.push(...chunk)
    if (chunk.length < size) break
  }
  return all
}
