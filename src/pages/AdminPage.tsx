import { useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { syncStatusLabel, visibilityLabel } from '../lib/labels.ts'
import { formatDateTime } from '../lib/records.ts'
import { supabase } from '../lib/supabase.ts'
import type { InviteRow, SyncStatusRow, Visibility } from '../lib/types.ts'

const VISIBILITIES: Visibility[] = ['public', 'partner', 'owner']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AdminPage() {
  const auth = useAuth()
  const portal = usePortal()
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [syncRows, setSyncRows] = useState<SyncStatusRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pendingSection, setPendingSection] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'partner' | 'owner'>('partner')
  const [note, setNote] = useState('')
  const [savingInvite, setSavingInvite] = useState(false)
  const [visibilityOverride, setVisibilityOverride] = useState<Record<string, Visibility>>({})

  async function loadAdmin() {
    const [inviteResult, syncResult] = await Promise.all([
      supabase.from('invited_emails').select('*').order('invited_at', { ascending: false }),
      supabase.from('sync_status').select('*').order('source'),
    ])
    if (inviteResult.error) throw new Error(inviteResult.error.message)
    if (syncResult.error) throw new Error(syncResult.error.message)
    setInvites((inviteResult.data ?? []) as InviteRow[])
    setSyncRows((syncResult.data ?? []) as SyncStatusRow[])
  }

  useEffect(() => {
    if (auth.role !== 'owner') return
    let cancel = false
    loadAdmin().catch((err: unknown) => {
      if (!cancel) setError(err instanceof Error ? err.message : 'Не вдалося завантажити адміністрування')
    })
    return () => {
      cancel = true
    }
  }, [auth.role])

  if (auth.role !== 'owner') {
    return (
      <>
        <PageHeader title="Адміністрування" />
        <p className="empty">Ця сторінка доступна лише власнику.</p>
      </>
    )
  }

  async function saveVisibility(section: string, visibleTo: Visibility) {
    setPendingSection(section)
    setVisibilityOverride((current) => ({ ...current, [section]: visibleTo }))
    setError(null)
    setInfo(null)
    const { error: updateError } = await supabase
      .from('section_access')
      .update({ visible_to: visibleTo, updated_at: new Date().toISOString() })
      .eq('section', section)
    setPendingSection(null)
    if (updateError) {
      setVisibilityOverride((current) => {
        const next = { ...current }
        delete next[section]
        return next
      })
      setError(updateError.message)
      return
    }
    setInfo(`Видимість «${section}» змінено на «${visibilityLabel(visibleTo)}».`)
    portal.reload()
  }

  async function addInvite(event: FormEvent) {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!EMAIL_RE.test(normalized)) {
      setError('Вкажіть коректну ел. пошту.')
      return
    }
    setSavingInvite(true)
    setError(null)
    setInfo(null)
    const { error: insertError } = await supabase.from('invited_emails').insert({
      email: normalized,
      role,
      note: note.trim() || null,
    })
    setSavingInvite(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setEmail('')
    setNote('')
    setRole('partner')
    setInfo(`${normalized} додано з роллю ${role}.`)
    await loadAdmin()
  }

  async function removeInvite(target: string) {
    if (!window.confirm(`Прибрати ${target} зі списку запрошень?`)) return
    setError(null)
    const { error: deleteError } = await supabase.from('invited_emails').delete().eq('email', target)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setInfo(`${target} прибрано.`)
    await loadAdmin()
  }

  return (
    <>
      <PageHeader
        title="Адміністрування"
        meta="Видимість розділів, запрошення та стан синхронізації. Зміни йдуть у Supabase від імені власника."
      />
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {info ? <p className="notice notice-ok">{info}</p> : null}

      <section className="panel admin-block">
        <h2>Видимість розділів</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Розділ</th>
                <th>Ключ</th>
                <th>Видимість</th>
              </tr>
            </thead>
            <tbody>
              {portal.sections.map((section) => (
                <tr key={section.section}>
                  <td>{section.label}</td>
                  <td className="mono">{section.section}</td>
                  <td>
                    <select
                      aria-label={`Видимість ${section.label}`}
                      value={visibilityOverride[section.section] ?? section.visible_to}
                      disabled={pendingSection === section.section}
                      onChange={(event) => {
                        const next = event.target.value
                        if (next === 'public' || next === 'partner' || next === 'owner') {
                          void saveVisibility(section.section, next)
                        }
                      }}
                    >
                      {VISIBILITIES.map((value) => (
                        <option key={value} value={value}>
                          {visibilityLabel(value)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel admin-block">
        <h2>Запрошені адреси</h2>
        <form className="invite-form" onSubmit={(event) => void addInvite(event)}>
          <label className="field field-grow">
            <span>Ел. пошта</span>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="partner@example.com" />
          </label>
          <label className="field">
            <span>Роль</span>
            <select value={role} onChange={(event) => setRole(event.target.value === 'owner' ? 'owner' : 'partner')}>
              <option value="partner">Партнер</option>
              <option value="owner">Власник</option>
            </select>
          </label>
          <label className="field field-grow">
            <span>Нотатка</span>
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="необов’язково" />
          </label>
          <button className="btn btn-primary" type="submit" disabled={savingInvite}>
            {savingInvite ? 'Збереження…' : 'Додати'}
          </button>
        </form>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Пошта</th>
                <th>Роль</th>
                <th>Запрошено</th>
                <th>Нотатка</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    Список порожній.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.email}>
                    <td className="mono">{invite.email}</td>
                    <td>{invite.role === 'owner' ? 'Власник' : 'Партнер'}</td>
                    <td>{formatDateTime(invite.invited_at)}</td>
                    <td>{invite.note || '—'}</td>
                    <td>
                      <button type="button" className="btn btn-danger" onClick={() => void removeInvite(invite.email)}>
                        Прибрати
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel admin-block">
        <h2>Синхронізація</h2>
        {syncRows.length === 0 ? (
          <p className="empty">Немає рядків sync_status.</p>
        ) : (
          <div className="sync-admin">
            {syncRows.map((row) => (
              <article key={row.source} className="sync-card">
                <header>
                  <strong className="mono">{row.source}</strong>
                  <span className={`mark ${row.status === 'ok' ? 'mark-new' : row.status === 'error' ? 'mark-updated' : 'mark-neutral'}`}>
                    {syncStatusLabel(row.status)}
                  </span>
                </header>
                <dl className="rail-facts">
                  <div>
                    <dt>Остання спроба</dt>
                    <dd>{formatDateTime(row.last_attempt_at)}</dd>
                  </div>
                  <div>
                    <dt>Останній успіх</dt>
                    <dd>{formatDateTime(row.last_success_at)}</dd>
                  </div>
                  <div>
                    <dt>Рядків</dt>
                    <dd>{row.records_synced ?? '—'}</dd>
                  </div>
                </dl>
                {row.error ? <p className="notice notice-error">{row.error}</p> : null}
                {row.details ? (
                  <details>
                    <summary>Деталі</summary>
                    <pre>{JSON.stringify(row.details, null, 2)}</pre>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
