/** Origin plus the Vite base path, with exactly one slash between them. */
export function appRedirectUrl(origin: string, basePath: string): string {
  const root = origin.replace(/\/$/, '')
  const base = basePath && basePath !== '/' ? basePath : '/'
  const normalized = base.startsWith('/') ? base : `/${base}`
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`
  return `${root}${withSlash}`
}
