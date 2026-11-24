import { useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { RecordBrowser } from '../components/RecordBrowser.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { visibilityLabel } from '../lib/labels.ts'
import { canSeeSection, decodeParam } from '../lib/records.ts'

export function SectionPage() {
  const params = useParams()
  const sectionKey = decodeParam(params.section)
  const portal = usePortal()
  const auth = useAuth()
  const meta = portal.sections.find((section) => section.section === sectionKey)
  const allowed = meta ? canSeeSection(meta.visible_to, auth.role) : false

  if (!portal.loading && portal.sections.length > 0 && !meta) {
    return (
      <>
        <PageHeader title="Розділ не знайдено" meta={sectionKey} />
        <p className="empty">Такого розділу немає в section_access.</p>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={meta?.label ?? (portal.loading ? 'Розділ' : sectionKey)}
        meta={
          meta
            ? `${meta.section} · видимість: ${visibilityLabel(meta.visible_to)}`
            : 'Завантаження розділу…'
        }
      />
      {!allowed && meta ? (
        <p className="empty">Цей розділ закритий для вашої ролі. Записи не показуються.</p>
      ) : (
        <RecordBrowser rows={portal.records} filename={sectionKey || 'section'} lockCategory={sectionKey} />
      )}
    </>
  )
}
