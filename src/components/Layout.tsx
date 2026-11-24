import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { useTheme } from '../context/ThemeContext.tsx'
import { roleLabel } from '../lib/labels.ts'
import { canSeeSection } from '../lib/records.ts'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function Layout() {
  const auth = useAuth()
  const portal = usePortal()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(params.get('q') ?? '')

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    setDraft(params.get('q') ?? '')
  }, [params])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        return
      }
      event.preventDefault()
      document.getElementById('global-search')?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sections = portal.sections.filter((section) => canSeeSection(section.visible_to, auth.role))

  return (
    <div className="app">
      <a className="skip" href="#content">
        До вмісту
      </a>
      {open ? (
        <button type="button" className="backdrop" aria-label="Закрити меню" onClick={() => setOpen(false)} />
      ) : null}
      <aside className={cx('sidebar', open && 'open')}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <rect width="32" height="32" rx="6" fill="currentColor" />
              <path d="M8 11.5h16M8 16h16M8 20.5h10" stroke="var(--brand-ink)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <span className="brand-name">DATABASE</span>
            <span className="brand-sub">Business & Intelligence</span>
          </span>
        </div>
        <nav className="nav-scroll" aria-label="Розділи">
          <p className="nav-label">Огляд</p>
          <NavLink to="/" end className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            Панель
          </NavLink>
          <p className="nav-label">Розділи</p>
          {portal.loading && sections.length === 0 ? (
            <div className="nav-skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ) : (
            sections.map((section) => (
              <NavLink
                key={section.section}
                to={`/section/${encodeURIComponent(section.section)}`}
                className={({ isActive }) => cx('nav-link', isActive && 'active')}
                title={section.section}
              >
                <span className="nav-text">{section.label}</span>
                {auth.role === 'owner' ? <span className="nav-vis">{shortVisibility(section.visible_to)}</span> : null}
              </NavLink>
            ))
          )}
          <p className="nav-label">Журнал</p>
          <NavLink to="/reports" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            Звіти
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            Історія оновлень
          </NavLink>
          <NavLink to="/archive" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            Архів
          </NavLink>
          {auth.role === 'owner' ? (
            <>
              <p className="nav-label">Керування</p>
              <NavLink to="/admin" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
                Адміністрування
              </NavLink>
            </>
          ) : null}
        </nav>
        <div className="side-foot">
          <span className={`role-pill role-${auth.role}`}>{roleLabel(auth.role)}</span>
          <span className="side-note">{auth.email ?? 'Без входу · публічна частина'}</span>
        </div>
      </aside>
      <div className="maincol">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label="Меню" onClick={() => setOpen(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
          <form
            className="search-form"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              const next = draft.trim()
              navigate(next ? `/search?q=${encodeURIComponent(next)}` : '/search')
            }}
          >
            <label className="sr-only" htmlFor="global-search">
              Пошук по всіх записах
            </label>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              id="global-search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Пошук по всіх записах"
              type="search"
            />
          </form>
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
            title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M16.5 14.5A6.5 6.5 0 0 1 9.5 7 6.5 6.5 0 1 0 16.5 14.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          {auth.email ? (
            <div className="account">
              <span className="account-email" title={auth.email}>
                {auth.email}
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => void auth.signOut()}>
                Вийти
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary">
              Увійти
            </NavLink>
          )}
        </header>
        <main id="content" className="content">
          {auth.notice ? (
            <div className="notice notice-error" role="alert">
              <span>{auth.notice}</span>
              <button type="button" className="btn btn-ghost" onClick={auth.clearNotice}>
                Закрити
              </button>
            </div>
          ) : null}
          {auth.role === 'none' ? (
            <div className="notice notice-error" role="status">
              Обліковий запис увійшов, але роль не призначено. Зверніться до власника.
            </div>
          ) : null}
          {portal.error ? (
            <div className="notice notice-error" role="alert">
              <span>Не вдалося завантажити дані: {portal.error}</span>
              <button type="button" className="btn btn-ghost" onClick={portal.reload}>
                Повторити
              </button>
            </div>
          ) : null}
          {!auth.ready ? <p className="boot">Перевірка сесії…</p> : <Outlet />}
        </main>
      </div>
    </div>
  )
}

function shortVisibility(value: string): string {
  if (value === 'public') return 'публ.'
  if (value === 'partner') return 'партн.'
  if (value === 'owner') return 'власн.'
  return value
}
