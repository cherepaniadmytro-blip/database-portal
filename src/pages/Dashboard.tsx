import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useAuth } from '../context/AuthContext.tsx'
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
        title="Панель"
        meta={`Видимі вам записи · ${roleLabel(auth.role)}. Усі числа рахуються лише з цих рядків.`}
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
          <section className="metrics" aria-label="Підсумки">
            <Metric label="Усього записів" value={formatNumber(counts.total)} hint="видимі вам" />
            <Metric label="Нові сьогодні" value={formatNumber(counts.newToday)} hint="date_added = сьогодні" />
            <Metric
              label="Оновлені сьогодні"
              value={formatNumber(counts.updatedToday)}
              hint="last_updated, без щойно доданих"
            />
            <Metric
              label="Остання синхронізація"
              value={sync?.last_success_at ? formatDateTime(sync.last_success_at) : '—'}
              hint={sync ? `${sync.source} · ${syncStatusLabel(sync.status)}` : 'last_sync()'}
            />
          </section>
          <section className="metrics metrics-secondary" aria-label="Нове за розділами">
            <Metric label="Нові вакансії" value={formatNumber(counts.newJobs)} hint="Jobs & Freelance · NEW або сьогодні" />
            <Metric label="Нові партнери" value={formatNumber(counts.newPartners)} hint="Partners · NEW або сьогодні" />
            <Metric
              label="Нові бізнес-можливості"
              value={formatNumber(counts.newOpportunities)}
              hint="Business Opportunities · NEW або сьогодні"
            />
          </section>
          <p className="fineprint">
            Сьогодні — {todayLabel}, календар Europe/Bratislava. Оцінка в топі: вага пріоритету (P1 найвищий) × 10 + потенціал.
          </p>
          <div className="split">
            <section className="panel">
              <div className="panel-head">
                <h2>Топ 10 за пріоритетом і потенціалом</h2>
              </div>
              {top.length === 0 ? (
                <p className="empty">Немає видимих записів.</p>
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
                      <span className="rank-score" title={`Пріоритет ${row.priority ?? '—'} · потенціал ${row.potential ?? '—'}`}>
                        {formatScore(rankScore(row))}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className="panel">
              <div className="panel-head">
                <h2>Останні оновлення</h2>
                <Link to="/history" className="text-link">
                  Уся історія
                </Link>
              </div>
              {latest.length === 0 ? (
                <p className="empty">Історія для видимих записів порожня.</p>
              ) : (
                <ul className="history-list">
                  {latest.map((item) => (
                    <li key={item.id}>
                      <div className="history-top">
                        <span className="mono">{item.changed_at}</span>
                        <span className="mark mark-neutral">{changeTypeLabel(item.change_type)}</span>
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
                <p className="desc">Обсяг прогону з last_sync(), не кількість видимих записів.</p>
                <ul className="sync-list">
                  {portal.sync.map((item) => (
                    <li key={item.source}>
                      <span className="mono">{item.source}</span>
                      <span>{item.last_success_at ? formatDateTime(item.last_success_at) : '—'}</span>
                      <span>{syncStatusLabel(item.status)}</span>
                      <span>{item.records_synced == null ? '—' : `${formatNumber(item.records_synced)} рядків`}</span>
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
