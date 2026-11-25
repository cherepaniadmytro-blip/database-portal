import { useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { RecordBrowser } from '../components/RecordBrowser.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { sectionLabel, visibilityLabel } from '../lib/labels.ts'
import { canSeeSection, decodeParam } from '../lib/records.ts'

export function SectionPage() {
  const params = useParams()
  const sectionKey = decodeParam(params.section)
  const portal = usePortal()
  const auth = useAuth()
  const { locale, t } = useLocale()
  const meta = portal.sections.find((section) => section.section === sectionKey)
  const allowed = meta ? canSeeSection(meta.visible_to, auth.role) : false

  if (!portal.loading && portal.sections.length > 0 && !meta) {
    return (
      <>
        <PageHeader title={t.section.notFound} meta={sectionKey} />
        <p className="empty">{t.section.missing}</p>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={meta ? sectionLabel(meta.section, meta.label, locale) : (portal.loading ? t.section.title : sectionKey)}
        meta={
          meta
            ? t.section.visibilityMeta(meta.section, visibilityLabel(meta.visible_to, locale))
            : t.section.loading
        }
      />
      {!allowed && meta ? (
        <p className="empty">{t.section.forbidden}</p>
      ) : (
        <RecordBrowser rows={portal.records} filename={sectionKey || 'section'} lockCategory={sectionKey} />
      )}
    </>
  )
}
