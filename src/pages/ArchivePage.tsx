import { PageHeader } from '../components/PageHeader.tsx'
import { RecordBrowser } from '../components/RecordBrowser.tsx'
import { usePortal } from '../context/PortalData.tsx'
import { useT } from '../context/LocaleContext.tsx'

export function ArchivePage() {
  const portal = usePortal()
  const t = useT()
  return (
    <>
      <PageHeader title={t.archive.title} meta={t.archive.meta} />
      <RecordBrowser rows={portal.records} filename="archive" archiveOnly showCategory />
    </>
  )
}
