import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { changeTypeLabel } from '../lib/labels.ts'
import { compareHistory } from '../lib/records.ts'

export function HistoryPage() {
  const { locale, t } = useLocale()
  const portal = usePortal()
  const [query, setQuery] = useState('')
  const [section, setSection] = useState('')
  const [changeType, setChangeType] = useState('')

  const sections = useMemo(() => {
    const values = new Set<string>()
    for (const item of portal.history) if (item.section) values.add(item.section)
    return [...values].sort((a, b) => a.localeCompare(b, locale))
  }, [portal.history])

  const types = useMemo(() => {
    const values = new Set<string>()
    for (const item of portal.history) if (item.change_type) values.add(item.change_type)
    return [...values].sort()
  }, [portal.history])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...portal.history]
      .filter((item) => {
        if (section && item.section !== section) return false
        if (changeType && item.change_type !== changeType) return false
        if (!q) return true
        return [item.record_id, item.section, item.change_type, item.previous_value, item.new_value, item.agent, item.reason, item.source]
          .filter(Boolean)
          .join('\n')
          .toLowerCase()
          .includes(q)
      })
      .sort(compareHistory)
  }, [portal.history, query, section, changeType])

  return (
    <>
      <PageHeader title={t.history.title} meta={t.history.meta} />
      <div className="filters">
        <label className="field field-grow">
          <span>{t.search.title}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.history.placeholder} type="search" />
        </label>
        <label className="field">
          <span>{t.history.section}</span>
          <select value={section} onChange={(event) => setSection(event.target.value)}>
            <option value="">{t.all}</option>
            {sections.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.history.type}</span>
          <select value={changeType} onChange={(event) => setChangeType(event.target.value)}>
            <option value="">{t.all}</option>
            {types.map((value) => (
              <option key={value} value={value}>
                {changeTypeLabel(value, locale)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="toolbar-count">{t.history.events(rows.length)}</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.history.time}</th>
              <th>{t.history.record}</th>
              <th>{t.history.section}</th>
              <th>{t.history.type}</th>
              <th>{t.history.newValue}</th>
              <th>{t.history.agent}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="empty-cell" colSpan={6}>
                  {t.history.empty}
                </td>
              </tr>
            ) : (
              rows.slice(0, 200).map((item) => (
                <tr key={item.id}>
                  <td className="mono col-date">{item.changed_at}</td>
                  <td className="mono">
                    {item.record_id ? <Link to={`/record/${encodeURIComponent(item.record_id)}`}>{item.record_id}</Link> : '—'}
                  </td>
                  <td>{item.section || '—'}</td>
                  <td>{changeTypeLabel(item.change_type, locale)}</td>
                  <td className="clip">{item.new_value || '—'}</td>
                  <td>{item.agent || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 200 ? <p className="fineprint">{t.history.truncated(200, rows.length)}</p> : null}
    </>
  )
}
