import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext.tsx'
import { fetchAll, supabase } from '../lib/supabase.ts'
import type { HistoryRow, RecordRow, ReportRow, SectionRow, SyncRow } from '../lib/types.ts'

type PortalValue = {
  loading: boolean
  error: string | null
  sections: SectionRow[]
  records: RecordRow[]
  history: HistoryRow[]
  reports: ReportRow[]
  sync: SyncRow[]
  reload: () => void
}

const PortalContext = createContext<PortalValue | null>(null)

async function loadPortal(): Promise<Omit<PortalValue, 'loading' | 'error' | 'reload'>> {
  const [sections, records, history, reports, syncResult] = await Promise.all([
    fetchAll<SectionRow>((from, to) =>
      supabase.from('section_access').select('*').order('sort_order', { ascending: true }).range(from, to),
    ),
    fetchAll<RecordRow>((from, to) =>
      supabase.from('records').select('*').order('id', { ascending: true }).range(from, to),
    ),
    fetchAll<HistoryRow>((from, to) =>
      supabase.from('update_history').select('*').order('id', { ascending: false }).range(from, to),
    ),
    fetchAll<ReportRow>((from, to) =>
      supabase.from('daily_reports').select('*').order('report_date', { ascending: false }).range(from, to),
    ),
    supabase.rpc('last_sync'),
  ])
  if (syncResult.error) throw new Error(syncResult.error.message)
  return {
    sections,
    records,
    history,
    reports,
    sync: (syncResult.data ?? []) as SyncRow[],
  }
}

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sections, setSections] = useState<SectionRow[]>([])
  const [records, setRecords] = useState<RecordRow[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [sync, setSync] = useState<SyncRow[]>([])
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    if (!auth.ready) return
    let cancel = false
    setLoading(true)
    setError(null)
    loadPortal()
      .then((data) => {
        if (cancel) return
        setSections(data.sections)
        setRecords(data.records)
        setHistory(data.history)
        setReports(data.reports)
        setSync(data.sync)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancel) return
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити дані')
        setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [auth.ready, auth.role, auth.session?.user.id, tick])

  const value = useMemo(
    () => ({ loading, error, sections, records, history, reports, sync, reload }),
    [loading, error, sections, records, history, reports, sync, reload],
  )

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export function usePortal(): PortalValue {
  const value = useContext(PortalContext)
  if (!value) throw new Error('usePortal поза PortalDataProvider')
  return value
}
