import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext.tsx'
import { fetchAll, supabase } from '../lib/supabase.ts'
import {
  parseEvent,
  parseInteraction,
  parseWorkflow,
  type Direction,
  type Interaction,
  type LogChannel,
  type OutreachStatus,
  type Relation,
  type TeamMember,
  type WorkflowEvent,
  type WorkflowMark,
  type WorkflowRow,
} from '../lib/crm.ts'

export type WorkflowPatch = {
  relationType?: Relation | null
  status?: OutreachStatus
  marks?: WorkflowMark[]
  assignedTo?: string | null
  nextStep?: string | null
}

type CrmValue = {
  /** Signed in as owner or invited partner: may read and edit workflow data (RLS enforces the same). */
  canEdit: boolean
  loading: boolean
  error: string | null
  userId: string | null
  workflows: Map<string, WorkflowRow>
  team: TeamMember[]
  reload: () => void
  save: (recordId: string, patch: WorkflowPatch) => Promise<string | null>
  takeOwnership: (recordId: string, fallbackRelation?: Relation | null) => Promise<string | null>
  loadInteractions: (recordId: string) => Promise<Interaction[]>
  loadAllInteractions: (limit?: number) => Promise<Interaction[]>
  addInteraction: (input: { recordId: string; direction: Direction; channel: LogChannel | null; summary: string; nextStep: string | null }) => Promise<string | null>
  loadEvents: (limit?: number) => Promise<WorkflowEvent[]>
  loadRecordEvents: (recordId: string, limit?: number) => Promise<WorkflowEvent[]>
  updateDisplayName: (name: string, targetUserId?: string | null) => Promise<string | null>
}

const CrmContext = createContext<CrmValue | null>(null)

export function CrmProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const canEdit = Boolean(auth.session) && (auth.role === 'owner' || auth.role === 'partner')
  const userId = auth.session?.user.id ?? null
  const [workflows, setWorkflows] = useState<Map<string, WorkflowRow>>(new Map())
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((v) => v + 1), [])

  useEffect(() => {
    if (!canEdit) {
      setWorkflows(new Map())
      setTeam([])
      return
    }
    let cancel = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const rows = await fetchAll<Record<string, unknown>>((from, to) =>
          supabase.from('record_workflow').select('*').order('record_id').range(from, to),
        )
        const map = new Map<string, WorkflowRow>()
        for (const raw of rows) {
          const row = parseWorkflow(raw)
          if (row) map.set(row.recordId, row)
        }
        const members = await supabase.rpc('team_members')
        if (cancel) return
        setWorkflows(map)
        setTeam(Array.isArray(members.data) ? (members.data as TeamMember[]) : [])
      } catch (err) {
        if (!cancel) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [canEdit, tick])

  const save = useCallback(
    async (recordId: string, patch: WorkflowPatch): Promise<string | null> => {
      if (!canEdit) return 'not allowed'
      const current = workflows.get(recordId)
      const payload = {
        record_id: recordId,
        relation_type: patch.relationType !== undefined ? patch.relationType : (current?.relationType ?? null),
        status: patch.status ?? current?.status ?? 'new',
        marks: patch.marks !== undefined ? patch.marks : (current?.marks ?? []),
        assigned_to: patch.assignedTo !== undefined ? patch.assignedTo : (current?.assignedTo ?? null),
        next_step: patch.nextStep !== undefined ? patch.nextStep : (current?.nextStep ?? null),
      }
      const { data, error: saveError } = await supabase.from('record_workflow').upsert(payload, { onConflict: 'record_id' }).select('*').single()
      if (saveError) return saveError.message
      const row = data ? parseWorkflow(data as Record<string, unknown>) : null
      if (row) {
        setWorkflows((prev) => {
          const next = new Map(prev)
          next.set(row.recordId, row)
          return next
        })
      }
      return null
    },
    [canEdit, workflows],
  )

  const takeOwnership = useCallback(
    async (recordId: string, fallbackRelation?: Relation | null): Promise<string | null> => {
      if (!canEdit || !userId) return 'not allowed'
      const current = workflows.get(recordId)
      const nextStatus = !current || current.status === 'new' ? 'started' : current.status
      return save(recordId, {
        assignedTo: userId,
        status: nextStatus,
        relationType: current?.relationType ?? fallbackRelation ?? null,
      })
    },
    [canEdit, userId, workflows, save],
  )

  const loadInteractions = useCallback(
    async (recordId: string): Promise<Interaction[]> => {
      if (!canEdit) return []
      const { data, error: loadError } = await supabase
        .from('record_interactions')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: true })
      if (loadError || !Array.isArray(data)) return []
      return data.map((raw) => parseInteraction(raw as Record<string, unknown>)).filter((row): row is Interaction => row !== null)
    },
    [canEdit],
  )

  const loadAllInteractions = useCallback(
    async (limit = 500): Promise<Interaction[]> => {
      if (!canEdit) return []
      const { data, error: loadError } = await supabase
        .from('record_interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (loadError || !Array.isArray(data)) return []
      return data.map((raw) => parseInteraction(raw as Record<string, unknown>)).filter((row): row is Interaction => row !== null)
    },
    [canEdit],
  )

  const addInteraction = useCallback<CrmValue['addInteraction']>(
    async (input) => {
      if (!canEdit) return 'not allowed'
      const { error: insertError } = await supabase.from('record_interactions').insert({
        record_id: input.recordId,
        direction: input.direction,
        channel: input.channel,
        summary: input.summary,
        next_step: input.nextStep,
      })
      return insertError ? insertError.message : null
    },
    [canEdit],
  )

  const loadEvents = useCallback(
    async (limit = 300): Promise<WorkflowEvent[]> => {
      if (!canEdit) return []
      const { data, error: loadError } = await supabase
        .from('workflow_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (loadError || !Array.isArray(data)) return []
      return data.map((raw) => parseEvent(raw as Record<string, unknown>)).filter((row): row is WorkflowEvent => row !== null)
    },
    [canEdit],
  )

  const loadRecordEvents = useCallback(
    async (recordId: string, limit = 50): Promise<WorkflowEvent[]> => {
      if (!canEdit) return []
      const { data, error: loadError } = await supabase
        .from('workflow_events')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (loadError || !Array.isArray(data)) return []
      return data.map((raw) => parseEvent(raw as Record<string, unknown>)).filter((row): row is WorkflowEvent => row !== null)
    },
    [canEdit],
  )

  const updateDisplayName = useCallback(
    async (name: string, targetUserId?: string | null): Promise<string | null> => {
      if (!canEdit || !userId) return "not allowed"
      const target = targetUserId ?? userId
      const { data, error: rpcError } = await supabase.rpc("update_display_name", {
        p_name: name,
        p_user_id: targetUserId ?? null,
      })
      if (rpcError) return rpcError.message
      const clean = typeof data === "string" ? data : name.trim() || null
      setTeam((prev) => prev.map((m) => (m.id === target ? { ...m, display_name: clean } : m)))
      return null
    },
    [canEdit, userId],
  )

  const value = useMemo<CrmValue>(
    () => ({
      canEdit,
      loading,
      error,
      userId,
      workflows,
      team,
      reload,
      save,
      takeOwnership,
      loadInteractions,
      loadAllInteractions,
      addInteraction,
      loadEvents,
      loadRecordEvents,
      updateDisplayName,
    }),
    [canEdit, loading, error, userId, workflows, team, reload, save, takeOwnership, loadInteractions, loadAllInteractions, addInteraction, loadEvents, loadRecordEvents, updateDisplayName],
  )
  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm(): CrmValue {
  const value = useContext(CrmContext)
  if (!value) throw new Error('useCrm поза CrmProvider')
  return value
}
