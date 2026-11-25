import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadCatalogData } from '../lib/catalogApi.ts'
import type { FacetRow, PublicRecord } from '../lib/catalog.ts'

type CatalogValue = {
  loading: boolean
  error: string | null
  source: 'public_records' | 'records' | null
  rows: PublicRecord[]
  facets: FacetRow[] | null
  reload: () => void
}

const CatalogContext = createContext<CatalogValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<CatalogValue['source']>(null)
  const [rows, setRows] = useState<PublicRecord[]>([])
  const [facets, setFacets] = useState<FacetRow[] | null>(null)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    let cancel = false
    setLoading(true)
    setError(null)
    loadCatalogData()
      .then((data) => {
        if (cancel) return
        setRows(data.rows)
        setFacets(data.facets)
        setSource(data.source)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancel) return
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити каталог')
        setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [tick])

  const value = useMemo(
    () => ({ loading, error, source, rows, facets, reload }),
    [loading, error, source, rows, facets, reload],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('useCatalog поза CatalogProvider')
  return value
}
