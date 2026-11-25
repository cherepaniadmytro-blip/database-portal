import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { useT } from '../context/LocaleContext.tsx'

export function NotFoundPage() {
  const t = useT()
  return (
    <>
      <PageHeader title={t.notFound.title} />
      <p className="empty">{t.notFound.body}</p>
      <Link to="/" className="text-link">
        {t.notFound.toCatalog}
      </Link>
    </>
  )
}
