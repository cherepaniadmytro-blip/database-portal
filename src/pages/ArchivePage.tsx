import { PageHeader } from '../components/PageHeader.tsx'
import { RecordBrowser } from '../components/RecordBrowser.tsx'
import { usePortal } from '../context/PortalData.tsx'

export function ArchivePage() {
  const portal = usePortal()
  return (
    <>
      <PageHeader title="Архів" meta="Записи зі статусом ARCHIVED або EXPIRED серед видимих вам." />
      <RecordBrowser rows={portal.records} filename="archive" archiveOnly showCategory />
    </>
  )
}
