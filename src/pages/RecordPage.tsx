import { Link, useParams } from 'react-router-dom'
import { OwnerNotes } from '../components/OwnerNotes.tsx'
import { PageHeader } from '../components/PageHeader.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { accessLabel, changeTypeLabel } from '../lib/labels.ts'
import {
  FIELDS,
  compareHistory,
  decodeParam,
  formatDateTime,
  formatDay,
  formatMaybeNumber,
  safeUrl,
} from '../lib/records.ts'
import type { FieldDef, RecordRow } from '../lib/types.ts'

export function RecordPage() {
  const params = useParams()
  const { locale, t } = useLocale()
  const id = decodeParam(params.id)
  const portal = usePortal()
  const row = portal.records.find((item) => item.id === id)
  const history = portal.history.filter((item) => item.record_id === id).sort(compareHistory)

  if (!row && portal.loading) {
    return <PageHeader title={t.record.title} meta={t.record.loading} />
  }

  if (!row) {
    return (
      <>
        <PageHeader title={t.record.unavailable} meta={id} />
        <p className="empty">{t.record.notVisible}</p>
        <Link to="/dashboard" className="text-link">
          {t.record.toDashboard}
        </Link>
      </>
    )
  }

  const links = [
    { label: t.record.source, href: safeUrl(row.source_url) },
    { label: t.record.website, href: safeUrl(row.website) },
    { label: t.record.details, href: safeUrl(row.details_link) },
  ].filter((item) => item.href)

  return (
    <>
      <PageHeader
        title={row.name}
        meta={
          <>
            <Link to={`/section/${encodeURIComponent(row.category)}`}>{row.category}</Link>
            {' · '}
            <span className="mono">{row.id}</span>
          </>
        }
        actions={
          <Link to={`/section/${encodeURIComponent(row.category)}`} className="btn btn-ghost">
            {t.record.toSection}
          </Link>
        }
      />
      <div className="detail">
        <section className="panel detail-main">
          {row.short_description ? <p className="lead">{row.short_description}</p> : null}
          <dl className="facts">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <dt>{t.fields[field.key as keyof typeof t.fields] ?? field.label}</dt>
                <dd>{renderField(field, row)}</dd>
              </div>
            ))}
          </dl>
        </section>
        <aside className="rail">
          <OwnerNotes id={row.id} />
          <section className="panel">
            <h2>{t.record.state}</h2>
            <StatusBadge status={row.status} />
            <dl className="rail-facts">
              <div>
                <dt>{t.record.priority}</dt>
                <dd>{row.priority || '—'}</dd>
              </div>
              <div>
                <dt>{t.record.potential}</dt>
                <dd>{formatMaybeNumber(row.potential)}</dd>
              </div>
              <div>
                <dt>{t.record.reliability}</dt>
                <dd>{formatMaybeNumber(row.reliability)}</dd>
              </div>
              <div>
                <dt>{t.record.access}</dt>
                <dd>{accessLabel(row.access_level, locale)}</dd>
              </div>
              <div>
                <dt>{t.record.added}</dt>
                <dd>{formatDay(row.date_added)}</dd>
              </div>
              <div>
                <dt>{t.record.updated}</dt>
                <dd>{formatDay(row.last_updated)}</dd>
              </div>
              <div>
                <dt>{t.record.checked}</dt>
                <dd>{formatDay(row.last_verified)}</dd>
              </div>
            </dl>
          </section>
          <section className="panel">
            <h2>{t.record.links}</h2>
            {links.length === 0 ? (
              <p className="empty">{t.record.noLinks}</p>
            ) : (
              <ul className="link-list">
                {links.map((item) => (
                  <li key={item.label}>
                    <a href={item.href!} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {row.source ? <p className="desc">{row.source}</p> : null}
          </section>
          <section className="panel">
            <h2>{t.record.history}</h2>
            {history.length === 0 ? (
              <p className="empty">{t.record.noHistory}</p>
            ) : (
              <ul className="history-list">
                {history.slice(0, 12).map((item) => (
                  <li key={item.id}>
                    <div className="history-top">
                      <span className="mono">{item.changed_at}</span>
                      <span className="mark mark-neutral">{changeTypeLabel(item.change_type, locale)}</span>
                    </div>
                    <p>{item.new_value || '—'}</p>
                    {item.reason ? <p className="desc">{item.reason}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}

function renderField(field: FieldDef, row: RecordRow) {
  const value = row[field.key]
  if (value == null || value === '') return '—'
  if (field.kind === 'link') {
    const href = safeUrl(String(value))
    return href ? (
      <a href={href} target="_blank" rel="noreferrer">
        {String(value)}
      </a>
    ) : (
      String(value)
    )
  }
  if (field.kind === 'date') return formatDay(String(value))
  if (field.kind === 'datetime') return formatDateTime(String(value))
  if (field.kind === 'number') return formatMaybeNumber(typeof value === 'number' ? value : Number(value))
  if (field.key === 'access_level') return accessLabel(String(value))
  if (field.key === 'status') return <StatusBadge status={String(value)} />
  return String(value)
}
