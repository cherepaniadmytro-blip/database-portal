import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AssigneeBadge, MarksBadges, OutreachBadge } from '../components/CrmBadges.tsx'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useCatalog } from '../context/CatalogData.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { channelLabel, crmMessages, geoLabel } from '../i18n/crm.ts'
import { detailHash } from '../lib/catalogRoute.ts'
import { displayLabel, sortCatalog } from '../lib/catalog.ts'
import { PIPELINE_RELATIONS, STATUSES, displayMemberName, groupByStatus, isRelation, memberDisplayName, statusTone, type Relation } from '../lib/crm.ts'
import { formatDateTime, formatMaybeNumber } from '../lib/records.ts'

export function PipelinePage() {
  const auth = useAuth()
  const crm = useCrm()
  const catalog = useCatalog()
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const [params, setParams] = useSearchParams()
  const [takingId, setTakingId] = useState<string | null>(null)
  const relation: Relation = isRelation(params.get('type')) ? (params.get('type') as Relation) : 'client'
  const person = params.get('who') ?? ''
  const showNew = params.get('new') !== '0'

  const columns = useMemo(
    () =>
      groupByStatus(
        sortCatalog(catalog.rows),
        crm.workflows,
        relation,
        (row) => row.relationType,
        (item) => {
          if (person === 'me') return item.workflow?.assignedTo === crm.userId
          if (person === 'none') return !item.workflow?.assignedTo
          if (person) return item.workflow?.assignedTo === person
          return true
        },
      ),
    [catalog.rows, crm.workflows, relation, person, crm.userId],
  )

  if (!auth.session || !crm.canEdit) {
    return (
      <>
        <PageHeader title={m.pipeline.title} />
        <p className="notice">{auth.session ? m.work.noAccess : m.pipeline.signIn}</p>
        {!auth.session ? (
          <Link className="btn btn-primary" to="/login">
            {m.account.signIn}
          </Link>
        ) : null}
      </>
    )
  }

  function set(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const visible = STATUSES.filter((status) => status !== 'new' || showNew)

  return (
    <>
      <PageHeader
        title={m.pipeline.title}
        meta={m.pipeline.meta}
        actions={
          <Link className="btn btn-ghost" to="/stats">
            {m.nav.stats}
          </Link>
        }
      />
      <nav className="tabs" aria-label={m.f.relation}>
        {PIPELINE_RELATIONS.map((value) => {
          const counts = groupByStatus(catalog.rows, crm.workflows, value, (row) => row.relationType)
          const total = STATUSES.reduce((sum, s) => sum + counts[s].length, 0)
          const active = STATUSES.filter((s) => s !== 'new').reduce((sum, s) => sum + counts[s].length, 0)
          return (
            <button key={value} type="button" className={`tab ${value === relation ? 'active' : ''}`} onClick={() => set('type', value)}>
              {m.relationPlural[value]}{' '}
              <span className="tab-count">
                {active > 0 ? `${active}/${total}` : total}
              </span>
            </button>
          )
        })}
      </nav>
      <div className="filters">
        <label className="field">
          <span>{m.f.assigned}</span>
          <select value={person} onChange={(event) => set('who', event.target.value)}>
            <option value="">{m.f.everyone}</option>
            <option value="me">{m.f.mine}</option>
            <option value="none">{m.f.unassigned}</option>
            {crm.team.map((member) => (
              <option key={member.id} value={member.id}>
                {displayMemberName(member.email, member.display_name)}
              </option>
            ))}
          </select>
        </label>
        <label className="field checkbox-field">
          <input type="checkbox" checked={showNew} onChange={(event) => set('new', event.target.checked ? '' : '0')} />
          <span>{m.pipeline.showNew(columns.new.length)}</span>
        </label>
      </div>
      {crm.error ? <p className="notice notice-error">{crm.error}</p> : null}
      <div className="pipeline">
        {visible.map((status) => (
          <section key={status} className={`pipeline-col tone-${statusTone(status)}`} aria-label={m.status[status]}>
            <header className="pipeline-head">
              <OutreachBadge status={status} />
              <span className="tab-count">{columns[status].length}</span>
            </header>
            {columns[status].length === 0 ? <p className="empty">{m.pipeline.empty}</p> : null}
            <ul className="pipeline-list">
              {columns[status].slice(0, 200).map(({ row, workflow }) => (
                <li key={row.id} className="pipeline-card">
                  <Link to={{ pathname: '/', hash: detailHash(row) }}>
                    <strong>{row.name}</strong>
                  </Link>
                  <span className="desc">
                    {displayLabel(row.languageGroup, locale)} · {displayLabel(row.platform, locale)} · {geoLabel(locale, row.geoScope)} · ★{' '}
                    {formatMaybeNumber(row.ratingScore)}
                  </span>
                  <div className="pipeline-badges">
                    <AssigneeBadge assignedTo={workflow?.assignedTo} team={crm.team} currentUserId={crm.userId} />
                    <MarksBadges marks={workflow?.marks} />
                    {!workflow?.assignedTo ? (
                      <button
                        type="button"
                        className="btn-inline"
                        disabled={takingId === row.id}
                        onClick={async () => {
                          setTakingId(row.id)
                          await crm.takeOwnership(row.id, row.relationType)
                          setTakingId(null)
                        }}
                      >
                        {m.work.takeWork}
                      </button>
                    ) : null}
                  </div>
                  <span className="desc">{channelLabel(locale, row.bestChannel)}</span>
                  {workflow?.nextStep ? <span className="desc">→ {workflow.nextStep}</span> : null}
                  {workflow?.updatedAt ? <span className="desc">{m.f.updatedBy(memberDisplayName(crm.team, workflow.updatedBy, workflow.updatedByEmail), formatDateTime(workflow.updatedAt))}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
