import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Сторінку не знайдено" />
      <p className="empty">Такої адреси в порталі немає.</p>
      <Link to="/" className="text-link">
        На каталог
      </Link>
    </>
  )
}
