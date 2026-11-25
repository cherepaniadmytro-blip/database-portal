import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import { useT } from '../context/LocaleContext.tsx'
import { formatDateTime } from '../lib/records.ts'
import { supabase } from '../lib/supabase.ts'

type OwnerNote = {
  notes: string
  updatedAt: string | null
}

export function OwnerNotes({ id }: { id: string }) {
  const auth = useAuth()
  const t = useT()
  const [note, setNote] = useState<OwnerNote | null>(null)

  useEffect(() => {
    if (!auth.session) {
      setNote(null)
      return
    }
    let cancel = false
    supabase
      .rpc('owner_notes', { p_ids: [id] })
      .then(({ data, error }) => {
        if (cancel || error || !Array.isArray(data)) return
        const row = data.find((item) => item && typeof item === 'object') as Record<string, unknown> | undefined
        const notes = typeof row?.notes_private === 'string' ? row.notes_private.trim() : ''
        if (!notes) {
          setNote(null)
          return
        }
        const updatedAt = typeof row?.updated_at === 'string' ? row.updated_at : null
        setNote({ notes, updatedAt })
      })
    return () => {
      cancel = true
    }
  }, [auth.session, id])

  if (!auth.session || !note) return null

  return (
    <section className="panel">
      <h2>{t.notes.title}</h2>
      <p className="lead">{note.notes}</p>
      {note.updatedAt ? <p className="desc">{t.notes.updated(formatDateTime(note.updatedAt))}</p> : null}
    </section>
  )
}
