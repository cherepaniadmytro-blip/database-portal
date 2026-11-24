import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { RecordBrowser } from '../components/RecordBrowser.tsx'
import { usePortal } from '../context/PortalData.tsx'

export function SearchPage() {
  const portal = usePortal()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''

  return (
    <>
      <PageHeader
        title="Пошук"
        meta="По всіх полях видимих записів: назва, опис, країна, джерело, нотатки, ID."
      />
      <RecordBrowser
        rows={portal.records}
        filename="search"
        showCategory
        query={query}
        onQueryChange={(next) => {
          const updated = new URLSearchParams(params)
          if (next) updated.set('q', next)
          else updated.delete('q')
          setParams(updated, { replace: true })
        }}
      />
    </>
  )
}
