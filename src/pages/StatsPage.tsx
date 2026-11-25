import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OutreachBadge, RelationBadge } from '../components/CrmBadges.tsx'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useCatalog } from '../context/CatalogData.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { channelLabel, crmMessages } from '../i18n/crm.ts'
import { detailHash } from '../lib/catalogRoute.ts'
import {
  DIRECTIONS,
  LOG_CHANNELS,
  MARKS,
  WORK_STATUSES,
  computeTeamStats,
  displayMemberName,
  memberDisplayName,
  type Direction,
  type Interaction,
  type LogChannel,
} from '../lib/crm.ts'
import { formatDateTime, formatNumber } from '../lib/records.ts'

export function StatsPage() {
  const auth = useAuth()
  const crm = useCrm()
  const catalog = useCatalog()
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(false)
  const [person, setPerson] = useState('')
  const [direction, setDirection] = useState<Direction | ''>('')
  const [channel, setChannel] = useState<LogChannel | ''>('')
  const [query, setQuery] = useState('')
  const [grouped, setGrouped] = useState(false)

  const refresh = useCallback(async () => {
    if (!crm.canEdit) {
      setInteractions([])
      return
    }
    setLoading(true)
    const rows = await crm.loadAllInteractions(500)
    setInteractions(rows)
    setLoading(false)
  }, [crm])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const stats = useMemo(
    () => computeTeamStats(crm.workflows, interactions, crm.team),
    [crm.workflows, interactions, crm.team],
  )

  const byId = useMemo(() => new Map(catalog.rows.map((row) => [row.id, row])), [catalog.rows])

  const filteredInteractions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return interactions.filter((entry) => {
      if (person && (entry.authorEmail ?? '') !== person) return false
      if (direction && entry.direction !== direction) return false
      if (channel && entry.channel !== channel) return false
      if (!q) return true
      const row = byId.get(entry.recordId)
      const haystack = [row?.name, entry.recordId, memberDisplayName(crm.team, entry.authorId, entry.authorEmail), entry.authorEmail, entry.summary, entry.nextStep]
        .filter(Boolean)
        .join('\n')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [interactions, person, direction, channel, query, byId])

  const groupedRecords = useMemo(() => {
    const map = new Map<string, Interaction[]>()
    for (const entry of filteredInteractions) {
      const list = map.get(entry.recordId) ?? []
      list.push(entry)
      map.set(entry.recordId, list)
    }
    return [...map.entries()]
  }, [filteredInteractions])

  if (!auth.session || !crm.canEdit) {
    return (
      <>
        <PageHeader title={m.stats.title} />
        <p className="notice">{auth.session ? m.work.noAccess : m.pipeline.signIn}</p>
        {!auth.session ? (
          <Link className="btn btn-primary" to="/login">
            {m.account.signIn}
          </Link>
        ) : null}
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={m.stats.title}
        meta={m.stats.meta}
        actions={
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => void refresh()}>
            {m.stats.refresh}
          </button>
        }
      />

      <section className="metrics" aria-label={m.stats.title}>
        <article className="metric">
          <p className="metric-label">{m.stats.kpiInWork}</p>
          <p className="metric-value">{formatNumber(stats.totals.taken)}</p>
        </article>
        <article className="metric">
          <p className="metric-label">{m.stats.kpiLetters}</p>
          <p className="metric-value">{formatNumber(stats.totals.lettersOut)}</p>
        </article>
        <article className="metric">
          <p className="metric-label">{m.stats.kpiReplies}</p>
          <p className="metric-value">{formatNumber(stats.totals.repliesIn)}</p>
        </article>
        <article className="metric">
          <p className="metric-label">{m.stats.kpiWorking}</p>
          <p className="metric-value">{formatNumber(stats.totals.byStatus.working)}</p>
        </article>
      </section>

      <section className="panel stats-block">
        <h2>{m.stats.teamTableTitle}</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{m.stats.member}</th>
                <th className="col-num">{m.stats.taken}</th>
                {WORK_STATUSES.map((status) => (
                  <th key={status} className="col-num">
                    {m.status[status]}
                  </th>
                ))}
                <th className="col-num">{m.stats.lettersOut}</th>
                <th className="col-num">{m.stats.repliesIn}</th>
                <th className="col-num">{m.stats.notesCount}</th>
                <th>{m.stats.marksCol}</th>
              </tr>
            </thead>
            <tbody>
              {stats.members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.displayName}</strong>
                    <div className="desc mono">{member.email}</div>
                  </td>
                  <td className="col-num mono">{member.taken}</td>
                  {WORK_STATUSES.map((status) => (
                    <td key={status} className="col-num mono">
                      {member.byStatus[status]}
                    </td>
                  ))}
                  <td className="col-num mono">{member.lettersOut}</td>
                  <td className="col-num mono">{member.repliesIn}</td>
                  <td className="col-num mono">{member.notes}</td>
                  <td>
                    <span className="desc">
                      {MARKS.filter((mark) => member.byMark[mark] > 0)
                        .map((mark) => `${m.marks[mark]}: ${member.byMark[mark]}`)
                        .join(' · ') || '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.unassigned.byStatus.started +
                stats.unassigned.byStatus.reviewed +
                stats.unassigned.byStatus.contacted +
                stats.unassigned.byStatus.replied +
                stats.unassigned.byStatus.working +
                stats.unassigned.byStatus.declined +
                stats.unassigned.lettersOut +
                stats.unassigned.repliesIn >
              0 ? (
                <tr>
                  <td>{m.stats.unassignedRow}</td>
                  <td className="col-num mono">{stats.unassigned.taken}</td>
                  {WORK_STATUSES.map((status) => (
                    <td key={status} className="col-num mono">
                      {stats.unassigned.byStatus[status]}
                    </td>
                  ))}
                  <td className="col-num mono">{stats.unassigned.lettersOut}</td>
                  <td className="col-num mono">{stats.unassigned.repliesIn}</td>
                  <td className="col-num mono">{stats.unassigned.notes}</td>
                  <td className="desc">—</td>
                </tr>
              ) : null}
            </tbody>
            <tfoot>
              <tr>
                <th>{m.stats.totalRow}</th>
                <th className="col-num mono">{stats.totals.taken}</th>
                {WORK_STATUSES.map((status) => (
                  <th key={status} className="col-num mono">
                    {stats.totals.byStatus[status]}
                  </th>
                ))}
                <th className="col-num mono">{stats.totals.lettersOut}</th>
                <th className="col-num mono">{stats.totals.repliesIn}</th>
                <th className="col-num mono">{stats.totals.notes}</th>
                <th>
                  <span className="desc">
                    {MARKS.filter((mark) => stats.totals.byMark[mark] > 0)
                      .map((mark) => `${m.marks[mark]}: ${stats.totals.byMark[mark]}`)
                      .join(' · ') || '—'}
                  </span>
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="panel stats-block">
        <h2>{m.stats.perRecordTitle}</h2>
        <p className="desc">{m.stats.perRecordMeta}</p>
        <div className="filters">
          <label className="field field-grow">
            <span>{m.stats.toWhom}</span>
            <input
              type="search"
              value={query}
              placeholder={m.stats.searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="field">
            <span>{m.f.person}</span>
            <select value={person} onChange={(event) => setPerson(event.target.value)}>
              <option value="">{m.f.everyone}</option>
              {crm.team.map((member) => (
                <option key={member.id} value={member.email}>
                  {displayMemberName(member.email, member.display_name)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{m.f.direction}</span>
            <select value={direction} onChange={(event) => setDirection(event.target.value as Direction | '')}>
              <option value="">{m.stats.allDirections}</option>
              {DIRECTIONS.map((value) => (
                <option key={value} value={value}>
                  {m.direction[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{m.stats.channelLabel}</span>
            <select value={channel} onChange={(event) => setChannel(event.target.value as LogChannel | '')}>
              <option value="">{m.stats.allChannels}</option>
              {LOG_CHANNELS.map((value) => (
                <option key={value} value={value}>
                  {channelLabel(locale, value)}
                </option>
              ))}
            </select>
          </label>
          <label className="field checkbox-field">
            <input type="checkbox" checked={grouped} onChange={(event) => setGrouped(event.target.checked)} />
            <span>{m.stats.groupByRecord}</span>
          </label>
        </div>

        {filteredInteractions.length === 0 ? (
          <p className="empty">{m.stats.emptyInteractions}</p>
        ) : grouped ? (
          <div className="stack">
            {groupedRecords.map(([recordId, entries]) => {
              const row = byId.get(recordId)
              const wf = crm.workflows.get(recordId)
              const href = row ? detailHash(row) : null
              return (
                <article key={recordId} className="record-comm-card">
                  <header className="record-comm-head">
                    {href ? (
                      <Link to={{ pathname: '/', hash: href }}>
                        <strong>{row?.name ?? recordId}</strong>
                      </Link>
                    ) : (
                      <Link to={`/record/${encodeURIComponent(recordId)}`}>
                        <strong>{recordId}</strong>
                      </Link>
                    )}
                    <div className="catalog-badges">
                      <RelationBadge relation={wf?.relationType ?? row?.relationType} />
                      <OutreachBadge status={wf?.status} />
                    </div>
                  </header>
                  <ol className="timeline">
                    {entries.map((entry) => (
                      <li key={entry.id} className={`timeline-item dir-${entry.direction}`}>
                        <div className="timeline-meta">
                          <strong>{m.direction[entry.direction]}</strong>
                          {entry.channel ? ` · ${channelLabel(locale, entry.channel)}` : ''} · {memberDisplayName(crm.team, entry.authorId, entry.authorEmail)} ·{' '}
                          {formatDateTime(entry.createdAt)}
                        </div>
                        <p className="timeline-text">{entry.summary}</p>
                        {entry.nextStep ? (
                          <p className="desc">
                            {m.f.nextStep}: {entry.nextStep}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{m.stats.when}</th>
                  <th>{m.stats.who}</th>
                  <th>{m.stats.toWhom}</th>
                  <th>{m.f.direction}</th>
                  <th>{m.stats.channelLabel}</th>
                  <th>{m.stats.what}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInteractions.map((entry) => {
                  const row = byId.get(entry.recordId)
                  const wf = crm.workflows.get(entry.recordId)
                  const href = row ? detailHash(row) : null
                  return (
                    <tr key={entry.id}>
                      <td className="mono col-date">{formatDateTime(entry.createdAt)}</td>
                      <td>{memberDisplayName(crm.team, entry.authorId, entry.authorEmail)}</td>
                      <td>
                        {href ? (
                          <Link to={{ pathname: '/', hash: href }}>{row?.name ?? entry.recordId}</Link>
                        ) : (
                          <Link to={`/record/${encodeURIComponent(entry.recordId)}`}>{entry.recordId}</Link>
                        )}
                        <div className="catalog-badges">
                          <OutreachBadge status={wf?.status} />
                        </div>
                      </td>
                      <td>{m.direction[entry.direction]}</td>
                      <td>{channelLabel(locale, entry.channel)}</td>
                      <td className="timeline-text">
                        {entry.summary}
                        {entry.nextStep ? <div className="desc">→ {entry.nextStep}</div> : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
