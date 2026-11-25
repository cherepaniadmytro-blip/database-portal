import { PageHeader } from '../components/PageHeader.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { reportTypeLabel, visibilityLabel } from '../lib/labels.ts'
import { formatDay, safeUrl } from '../lib/records.ts'

export function ReportsPage() {
  const portal = usePortal()
  const { locale, t } = useLocale()
  const reports = [...portal.reports].sort((a, b) => (a.report_date < b.report_date ? 1 : a.report_date > b.report_date ? -1 : 0))

  return (
    <>
      <PageHeader title={t.reports.title} meta={t.reports.meta} />
      {reports.length === 0 ? (
        <p className="empty">{t.reports.empty}</p>
      ) : (
        <ul className="report-list">
          {reports.map((report) => {
            const href = safeUrl(report.doc_url)
            return (
              <li key={report.id} className="panel report-card">
                <div className="report-top">
                  <span className="mark mark-neutral">{reportTypeLabel(report.report_type, locale)}</span>
                  <span className="mono">{formatDay(report.report_date)}</span>
                  <span className="desc">{visibilityLabel(report.visible_to, locale)}</span>
                </div>
                <h2>{report.title}</h2>
                {report.summary ? <p>{report.summary}</p> : null}
                {href ? (
                  <a className="btn btn-primary" href={href} target="_blank" rel="noreferrer">
                    {t.reports.openDoc}
                  </a>
                ) : (
                  <p className="desc">{t.reports.noLink}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
