import { useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { displayMemberName } from '../lib/crm.ts'
import { roleLabel, sectionLabel, syncStatusLabel, visibilityLabel } from '../lib/labels.ts'
import { formatDateTime } from '../lib/records.ts'
import { supabase } from '../lib/supabase.ts'
import type { InviteRow, SyncStatusRow, Visibility } from '../lib/types.ts'

const VISIBILITIES: Visibility[] = ['public', 'partner', 'owner']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AdminPage() {
  const auth = useAuth()
  const portal = usePortal()
  const crm = useCrm()
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({})
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const { locale, t } = useLocale()
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
      if (!cancel) setError(err instanceof Error ? err.message : t.admin.loadFailed)
    })
    return () => {
      cancel = true
    }
  }, [auth.role])

  if (auth.role !== 'owner') {
    return (
      <>
        <PageHeader title={t.admin.title} />
        <p className="empty">{t.admin.onlyOwner}</p>
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
    setInfo(t.admin.visibilityChanged(section, visibilityLabel(visibleTo, locale)))
    portal.reload()
  }

  async function addInvite(event: FormEvent) {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!EMAIL_RE.test(normalized)) {
      setError(t.admin.badEmail)
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
    setInfo(t.admin.invited(normalized, role === "owner" ? t.roles.owner : t.roles.partner))
    await loadAdmin()
  }

  async function removeInvite(target: string) {
    if (!window.confirm(t.admin.confirmRemove(target))) return
    setError(null)
    const { error: deleteError } = await supabase.from('invited_emails').delete().eq('email', target)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setInfo(t.admin.removed(target))
    await loadAdmin()
  }

  return (
    <>
      <PageHeader
        title={t.admin.title}
        meta={t.admin.meta}
      />
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {info ? <p className="notice notice-ok">{info}</p> : null}

      <section className="panel admin-block">
        <h2>{t.admin.sectionVisibility}</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.admin.section}</th>
                <th>{t.admin.key}</th>
                <th>{t.admin.visibility}</th>
              </tr>
            </thead>
            <tbody>
              {portal.sections.map((section) => (
                <tr key={section.section}>
                  <td>{sectionLabel(section.section, section.label, locale)}</td>
                  <td className="mono">{section.section}</td>
                  <td>
                    <select
                      aria-label={t.admin.visibilityOf(sectionLabel(section.section, section.label, locale))}
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
                          {visibilityLabel(value, locale)}
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
        <h2>{t.admin.invites}</h2>
        <form className="invite-form" onSubmit={(event) => void addInvite(event)}>
          <label className="field field-grow">
            <span>{t.admin.email}</span>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="partner@example.com" />
          </label>
          <label className="field">
            <span>{t.admin.role}</span>
            <select value={role} onChange={(event) => setRole(event.target.value === 'owner' ? 'owner' : 'partner')}>
              <option value="partner">{t.roles.partner}</option>
              <option value="owner">{t.roles.owner}</option>
            </select>
          </label>
          <label className="field field-grow">
            <span>{t.admin.note}</span>
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.admin.notePlaceholder} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={savingInvite}>
            {savingInvite ? t.admin.saving : t.admin.add}
          </button>
        </form>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.admin.mail}</th>
                <th>{t.admin.role}</th>
                <th>{t.admin.invitedAt}</th>
                <th>{t.admin.note}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    {t.admin.emptyInvites}
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.email}>
                    <td className="mono">{invite.email}</td>
                    <td>{invite.role === "owner" ? t.roles.owner : t.roles.partner}</td>
                    <td>{formatDateTime(invite.invited_at)}</td>
                    <td>{invite.note || '—'}</td>
                    <td>
                      <button type="button" className="btn btn-danger" onClick={() => void removeInvite(invite.email)}>
                        {t.admin.remove}
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
        <h2>{t.admin.teamNames}</h2>
        <p className="desc">{t.admin.teamNamesMeta}</p>
        {crm.team.length === 0 ? (
          <p className="empty">{t.admin.noTeamMembers}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.admin.mail}</th>
                  <th>{t.admin.role}</th>
                  <th>{t.admin.displayName}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {crm.team.map((member) => {
                  const value = nameDrafts[member.id] ?? member.display_name ?? ""
                  return (
                    <tr key={member.id}>
                      <td className="mono">{member.email}</td>
                      <td>{roleLabel(member.role === "owner" ? "owner" : "partner", locale)}</td>
                      <td>
                        <input
                          aria-label={`${t.admin.displayName}: ${member.email}`}
                          value={value}
                          maxLength={80}
                          placeholder={t.admin.displayNamePlaceholder}
                          onChange={(event) => setNameDrafts((prev) => ({ ...prev, [member.id]: event.target.value }))}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={savingMemberId === member.id}
                          onClick={async () => {
                            setSavingMemberId(member.id)
                            setError(null)
                            setInfo(null)
                            const err = await crm.updateDisplayName(value, member.id)
                            setSavingMemberId(null)
                            if (err) setError(err)
                            else setInfo(t.admin.nameSaved(displayMemberName(member.email, value)))
                          }}
                        >
                          {savingMemberId === member.id ? t.admin.saving : t.admin.saveName}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel admin-block">
        <h2>{t.admin.sync}</h2>
        {syncRows.length === 0 ? (
          <p className="empty">{t.admin.noSync}</p>
        ) : (
          <div className="sync-admin">
            {syncRows.map((row) => (
              <article key={row.source} className="sync-card">
                <header>
                  <strong className="mono">{row.source}</strong>
                  <span className={`mark ${row.status === 'ok' ? 'mark-new' : row.status === 'error' ? 'mark-updated' : 'mark-neutral'}`}>
                    {syncStatusLabel(row.status, locale)}
                  </span>
                </header>
                <dl className="rail-facts">
                  <div>
                    <dt>{t.admin.lastAttempt}</dt>
                    <dd>{formatDateTime(row.last_attempt_at)}</dd>
                  </div>
                  <div>
                    <dt>{t.admin.lastSuccess}</dt>
                    <dd>{formatDateTime(row.last_success_at)}</dd>
                  </div>
                  <div>
                    <dt>{t.admin.rowCount}</dt>
                    <dd>{row.records_synced ?? '—'}</dd>
                  </div>
                </dl>
                {row.error ? <p className="notice notice-error">{row.error}</p> : null}
                {row.details ? (
                  <details>
                    <summary>{t.admin.details}</summary>
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
