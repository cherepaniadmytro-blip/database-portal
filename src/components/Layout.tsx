import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { crmMessages } from '../i18n/crm.ts'
import { useLocale } from '../context/LocaleContext.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { useTheme } from '../context/ThemeContext.tsx'
import { roleLabel, sectionLabel } from '../lib/labels.ts'
import { canSeeSection } from '../lib/records.ts'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function Layout() {
  const auth = useAuth()
  const portal = usePortal()
  const { locale, t } = useLocale()
  const crm = useCrm()
  const cm = crmMessages(locale)
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
        {t.skipToContent}
      </a>
      {open ? (
        <button type="button" className="backdrop" aria-label={t.closeMenu} onClick={() => setOpen(false)} />
      ) : null}
      <aside className={cx('sidebar', open && 'open')}>
        <NavLink to={{ pathname: '/', hash: '' }} className="brand" end>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <rect width="32" height="32" rx="6" fill="currentColor" />
              <path d="M8 11.5h16M8 16h16M8 20.5h10" stroke="var(--brand-ink)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <span className="brand-name">DATABASE</span>
            <span className="brand-sub">{t.brandSub}</span>
          </span>
        </NavLink>
        <nav className="nav-scroll" aria-label={t.nav.sections}>
          <p className="nav-label">{t.nav.overview}</p>
          <NavLink to={{ pathname: '/', hash: '' }} end className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            {t.nav.catalog}
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            {t.nav.dashboard}
          </NavLink>
          <NavLink to="/help" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            {cm.nav.help}
          </NavLink>
          {crm.canEdit ? (
            <>
              <p className="nav-label">{cm.nav.work}</p>
              <NavLink to="/pipeline" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
                {cm.nav.pipeline}
              </NavLink>
              <NavLink to="/stats" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
                {cm.nav.stats}
              </NavLink>
              <NavLink to="/activity" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
                {cm.nav.activity}
              </NavLink>
            </>
          ) : null}
          {auth.session ? (
            <NavLink to="/account" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
              {cm.nav.account}
            </NavLink>
          ) : null}
          <p className="nav-label">{t.nav.sections}</p>
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
                <span className="nav-text">{sectionLabel(section.section, section.label, locale)}</span>
                {auth.role === 'owner' ? <span className="nav-vis">{shortVisibility(section.visible_to, t)}</span> : null}
              </NavLink>
            ))
          )}
          <p className="nav-label">{t.nav.journal}</p>
          <NavLink to="/reports" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            {t.nav.reports}
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            {t.nav.history}
          </NavLink>
          <NavLink to="/archive" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
            {t.nav.archive}
          </NavLink>
          {auth.role === 'owner' ? (
            <>
              <p className="nav-label">{t.nav.manage}</p>
              <NavLink to="/admin" className={({ isActive }) => cx('nav-link', isActive && 'active')}>
                {t.nav.admin}
              </NavLink>
            </>
          ) : null}
        </nav>
        <div className="side-foot">
          <span className={`role-pill role-${auth.role}`}>{auth.ready ? roleLabel(auth.role, locale) : '…'}</span>
          <span className="side-note">{auth.email ?? t.guestOpen}</span>
        </div>
      </aside>
      <div className="maincol">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label={t.menu} onClick={() => setOpen(true)}>
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
              {t.searchAria}
            </label>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              id="global-search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t.searchPlaceholder}
              type="search"
            />
          </form>
          <LanguageSwitcher />
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            title={theme === 'dark' ? t.themeLightTitle : t.themeDarkTitle}
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
          {auth.ready && auth.email ? (
            <div className="account">
              <span className="account-email" title={auth.email}>
                {auth.email}
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => void auth.signOut()}>
                {t.logout}
              </button>
            </div>
          ) : auth.ready ? (
            <NavLink to="/login" className="text-login">
              {t.login}
            </NavLink>
          ) : null}
        </header>
        <main id="content" className="content">
          {auth.notice ? (
            <div className="notice notice-error" role="alert">
              <span>{auth.notice}</span>
              <button type="button" className="btn btn-ghost" onClick={auth.clearNotice}>
                {t.close}
              </button>
            </div>
          ) : null}
          {auth.role === 'none' ? (
            <div className="notice notice-error" role="status">
              {t.roleNone}
            </div>
          ) : null}
          {portal.error ? (
            <div className="notice notice-error" role="alert">
              <span>{t.loadFailed}: {portal.error}</span>
              <button type="button" className="btn btn-ghost" onClick={portal.reload}>
                {t.retry}
              </button>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function shortVisibility(value: string, t: { visibilityShort: { public: string; partner: string; owner: string } }): string {
  if (value === 'public' || value === 'partner' || value === 'owner') return t.visibilityShort[value]
  return value
}
