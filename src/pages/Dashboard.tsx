import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { changeTypeLabel, roleLabel, syncStatusLabel } from '../lib/labels.ts'
import {
  compareHistory,
  dashboardCounts,
  formatDateTime,
  formatNumber,
  latestSync,
  rankScore,
  todayISO,
  topRecords,
} from '../lib/records.ts'

export function DashboardPage() {
  const portal = usePortal()
  const auth = useAuth()
  const { locale, t } = useLocale()
  const today = todayISO()
  const counts = dashboardCounts(portal.records, today)
  const top = topRecords(portal.records, 10)
  const latest = [...portal.history].sort(compareHistory).slice(0, 8)
  const sync = latestSync(portal.sync)
  const [year, month, day] = today.split('-')
  const todayLabel = `${day}.${month}.${year}`

  return (
    <>
      <PageHeader
        title={t.dashboard.title}
        meta={
          counts.total === 0 && !portal.loading
            ? t.dashboard.metaPublic(roleLabel(auth.role, locale))
            : t.dashboard.metaSignedIn(roleLabel(auth.role, locale))
        }
        actions={
          <Link to={{ pathname: '/', hash: '' }} className="btn btn-ghost">
            {t.nav.catalog}
          </Link>
        }
      />
      {portal.loading && portal.records.length === 0 ? (
        <div className="metrics" aria-hidden="true">
          <div className="metric skeleton-block" />
          <div className="metric skeleton-block" />
          <div className="metric skeleton-block" />
          <div className="metric skeleton-block" />
        </div>
      ) : (
        <>
          <section className="metrics" aria-label={t.dashboard.totals}>
            <Metric label={t.dashboard.totalRecords} value={formatNumber(counts.total)} hint={t.dashboard.visibleToYou} />
            <Metric label={t.dashboard.newToday} value={formatNumber(counts.newToday)} hint={t.dashboard.newTodayHint} />
            <Metric
              label={t.dashboard.updatedToday}
              value={formatNumber(counts.updatedToday)}
              hint={t.dashboard.updatedTodayHint}
            />
            <Metric
              label={t.dashboard.lastSync}
              value={sync?.last_success_at ? formatDateTime(sync.last_success_at) : '—'}
              hint={sync ? `${sync.source} · ${syncStatusLabel(sync.status, locale)}` : 'last_sync()'}
            />
          </section>
          <section className="metrics metrics-secondary" aria-label={t.dashboard.newBySection}>
            <Metric label={t.dashboard.newJobs} value={formatNumber(counts.newJobs)} hint={t.dashboard.newJobsHint} />
            <Metric label={t.dashboard.newPartners} value={formatNumber(counts.newPartners)} hint={t.dashboard.newPartnersHint} />
            <Metric
              label={t.dashboard.newOpps}
              value={formatNumber(counts.newOpportunities)}
              hint={t.dashboard.newOppsHint}
            />
          </section>
          <p className="fineprint">
            {t.dashboard.fineprint(todayLabel)}
          </p>
          <div className="split">
            <section className="panel">
              <div className="panel-head">
                <h2>{t.dashboard.top10}</h2>
              </div>
              {top.length === 0 ? (
                <p className="empty">{t.dashboard.noVisible}</p>
              ) : (
                <ol className="rank-list">
                  {top.map((row, index) => (
                    <li key={row.id}>
                      <span className="rank-n">{index + 1}</span>
                      <div className="rank-body">
                        <Link to={`/record/${encodeURIComponent(row.id)}`}>{row.name}</Link>
                        <span className="desc">{row.category}</span>
                      </div>
                      <StatusBadge status={row.status} />
                      <span className="rank-score" title={t.dashboard.scoreTitle(row.priority ?? t.dash, String(row.potential ?? t.dash))}>
                        {formatScore(rankScore(row))}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className="panel">
              <div className="panel-head">
                <h2>{t.dashboard.recent}</h2>
                <Link to="/history" className="text-link">
                  {t.dashboard.allHistory}
                </Link>
              </div>
              {latest.length === 0 ? (
                <p className="empty">{t.dashboard.historyEmpty}</p>
              ) : (
                <ul className="history-list">
                  {latest.map((item) => (
                    <li key={item.id}>
                      <div className="history-top">
                        <span className="mono">{item.changed_at}</span>
                        <span className="mark mark-neutral">{changeTypeLabel(item.change_type, locale)}</span>
                      </div>
                      <div>
                        {item.record_id ? (
                          <Link to={`/record/${encodeURIComponent(item.record_id)}`}>{item.new_value || item.record_id}</Link>
                        ) : (
                          item.new_value || '—'
                        )}
                      </div>
                      <p className="desc">
                        {item.section || '—'}
                        {item.agent ? ` · ${item.agent}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {portal.sync.length > 0 ? (
                <>
                <p className="desc">{t.dashboard.syncNote}</p>
                <ul className="sync-list">
                  {portal.sync.map((item) => (
                    <li key={item.source}>
                      <span className="mono">{item.source}</span>
                      <span>{item.last_success_at ? formatDateTime(item.last_success_at) : '—'}</span>
                      <span>{syncStatusLabel(item.status, locale)}</span>
                      <span>{item.records_synced == null ? '—' : t.dashboard.rows(formatNumber(item.records_synced))}</span>
                    </li>
                  ))}
                </ul>
                </>
              ) : null}
            </section>
          </div>
        </>
      )}
    </>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="metric">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-hint">{hint}</p>
    </article>
  )
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
