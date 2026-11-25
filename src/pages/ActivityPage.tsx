import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useCatalog } from '../context/CatalogData.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { channelLabel, crmMessages } from '../i18n/crm.ts'
import { detailHash } from '../lib/catalogRoute.ts'
import { isChannel, isRelation, isStatus, type WorkflowEvent } from '../lib/crm.ts'
import { formatDateTime } from '../lib/records.ts'

export function ActivityPage() {
  const auth = useAuth()
  const crm = useCrm()
  const catalog = useCatalog()
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const [events, setEvents] = useState<WorkflowEvent[]>([])
  const [person, setPerson] = useState('')

  useEffect(() => {
    let cancel = false
    void crm.loadEvents(300).then((rows) => {
      if (!cancel) setEvents(rows)
    })
    return () => {
      cancel = true
    }
  }, [crm])

  if (!auth.session || !crm.canEdit) {
    return (
      <>
        <PageHeader title={m.activity.title} />
        <p className="notice">{auth.session ? m.work.noAccess : m.pipeline.signIn}</p>
        {!auth.session ? (
          <Link className="btn btn-primary" to="/login">
            {m.account.signIn}
          </Link>
        ) : null}
      </>
    )
  }

  const byId = new Map(catalog.rows.map((row) => [row.id, row]))
  const label = (value: string | null): string | null => {
    if (!value) return value
    if (isStatus(value)) return m.status[value]
    if (isRelation(value)) return m.relation[value]
    if (isChannel(value)) return channelLabel(locale, value)
    return value
  }
  const translate = (event: WorkflowEvent) => {
    if (event.event === 'created') {
      const parts = (event.newValue ?? '').split(' | ').map((part) => label(part.trim()) ?? part)
      return m.activity.event('created', null, parts.join(' · '))
    }
    return m.activity.event(event.event, label(event.oldValue), label(event.newValue))
  }
  const shown = person ? events.filter((event) => event.actorEmail === person) : events

  return (
    <>
      <PageHeader title={m.activity.title} meta={m.activity.meta} />
      <div className="filters">
        <label className="field">
          <span>{m.f.person}</span>
          <select value={person} onChange={(event) => setPerson(event.target.value)}>
            <option value="">{m.f.everyone}</option>
            {crm.team.map((member) => (
              <option key={member.id} value={member.email}>
                {member.email}
              </option>
            ))}
          </select>
        </label>
      </div>
      {shown.length === 0 ? (
        <p className="empty">{m.activity.empty}</p>
      ) : (
        <ol className="timeline">
          {shown.map((event) => {
            const row = byId.get(event.recordId)
            const href = row ? detailHash(row) : null
            return (
              <li key={event.id} className="timeline-item">
                <div className="timeline-meta">
                  {formatDateTime(event.createdAt)} · <strong>{event.actorEmail ?? '—'}</strong>
                </div>
                <p className="timeline-text">
                  {href ? <Link to={{ pathname: '/', hash: href }}>{row?.name ?? event.recordId}</Link> : event.recordId}: {translate(event)}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}
