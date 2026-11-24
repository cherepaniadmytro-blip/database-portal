import type { ReactNode } from 'react'
import { useEffect } from 'react'

export function useTitle(page: string) {
  useEffect(() => {
    document.title = page ? `${page} — DATABASE` : 'DATABASE — Business & Intelligence'
  }, [page])
}

export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string
  meta?: ReactNode
  actions?: ReactNode
}) {
  useTitle(title)
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {meta ? <p className="lede">{meta}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}
