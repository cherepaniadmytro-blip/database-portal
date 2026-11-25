import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { channelLabel, crmMessages } from '../i18n/crm.ts'
import { DIRECTIONS, LOG_CHANNELS, RELATIONS, STATUSES, type Direction, type Interaction, type LogChannel, type OutreachStatus, type Relation } from '../lib/crm.ts'
import type { PublicRecord } from '../lib/catalog.ts'
import { formatDateTime } from '../lib/records.ts'
import { OutreachBadge, RelationBadge } from './CrmBadges.tsx'
import { LetterDialog } from './LetterDialog.tsx'

/** Relation / channel facts for everyone; workflow editing and the interaction log for the signed-in team only. */
export function WorkflowPanel({ row }: { row: PublicRecord }) {
  const auth = useAuth()
  const crm = useCrm()
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const workflow = crm.workflows.get(row.id)
  const relation = workflow?.relationType ?? row.relationType ?? row.suggestedRelationType

  const [draftRelation, setDraftRelation] = useState<Relation | ''>(relation ?? '')
  const [draftStatus, setDraftStatus] = useState<OutreachStatus>(workflow?.status ?? 'new')
  const [draftAssigned, setDraftAssigned] = useState<string>(workflow?.assignedTo ?? '')
  const [draftNext, setDraftNext] = useState<string>(workflow?.nextStep ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [letterOpen, setLetterOpen] = useState(false)
  const [log, setLog] = useState<Interaction[]>([])

  useEffect(() => {
    setDraftRelation(relation ?? '')
    setDraftStatus(workflow?.status ?? 'new')
    setDraftAssigned(workflow?.assignedTo ?? '')
    setDraftNext(workflow?.nextStep ?? '')
  }, [relation, workflow?.status, workflow?.assignedTo, workflow?.nextStep])

  const refreshLog = useCallback(async () => {
    if (!crm.canEdit) {
      setLog([])
      return
    }
    setLog(await crm.loadInteractions(row.id))
  }, [crm, row.id])

  useEffect(() => {
    void refreshLog()
  }, [refreshLog])

  async function save(patch?: { status?: OutreachStatus }) {
    setSaving(true)
    setMessage(null)
    const error = await crm.save(row.id, {
      relationType: draftRelation || null,
      status: patch?.status ?? draftStatus,
      assignedTo: draftAssigned || null,
      nextStep: draftNext.trim() || null,
    })
    setSaving(false)
    setMessage(error ?? m.work.saved)
  }

  const memberEmail = (id: string | null | undefined) => crm.team.find((member) => member.id === id)?.email ?? null

  return (
    <section className="panel workflow-panel">
      <h2>{m.work.title}</h2>
      <dl className="facts">
        <div>
          <dt>{m.f.relation}</dt>
          <dd>
            <RelationBadge relation={relation} />
            {!relation ? '—' : null}
          </dd>
        </div>
        {row.relationReason ? (
          <div>
            <dt>{m.f.relationReason}</dt>
            <dd>{row.relationReason}</dd>
          </div>
        ) : null}
        {row.bestChannel ? (
          <div>
            <dt>{m.f.bestChannel}</dt>
            <dd>{channelLabel(locale, row.bestChannel)}</dd>
          </div>
        ) : null}
        {row.channelReason ? (
          <div>
            <dt>{m.f.channelReason}</dt>
            <dd>{row.channelReason}</dd>
          </div>
        ) : null}
      </dl>

      {!auth.session ? (
        <p className="desc">
          <Link to="/login">{m.work.signInToEdit}</Link>
        </p>
      ) : !crm.canEdit ? (
        <p className="desc">{m.work.noAccess}</p>
      ) : (
        <>
          <div className="workflow-status">
            <OutreachBadge status={workflow?.status} />
            {workflow?.updatedAt ? (
              <span className="desc">{m.f.updatedBy(workflow.updatedByEmail ?? '—', formatDateTime(workflow.updatedAt))}</span>
            ) : null}
          </div>
          <form
            className="filters workflow-form"
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              void save()
            }}
          >
            <label className="field">
              <span>{m.f.relation}</span>
              <select value={draftRelation} onChange={(event) => setDraftRelation(event.target.value as Relation | '')}>
                <option value="">—</option>
                {RELATIONS.map((value) => (
                  <option key={value} value={value}>
                    {m.relation[value]}
                    {value === row.suggestedRelationType ? ` (${m.f.suggested})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{m.f.outreach}</span>
              <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as OutreachStatus)}>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {m.status[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{m.f.assigned}</span>
              <select value={draftAssigned} onChange={(event) => setDraftAssigned(event.target.value)}>
                <option value="">{m.f.nobody}</option>
                {crm.team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-grow">
              <span>{m.f.nextStep}</span>
              <input value={draftNext} onChange={(event) => setDraftNext(event.target.value)} maxLength={500} />
            </label>
            <div className="page-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? m.work.saving : m.work.save}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setLetterOpen(true)}>
                {m.work.prepare}
              </button>
            </div>
          </form>
          {message ? <p className="desc" role="status">{message}</p> : null}
          {workflow?.contactedAt ? (
            <p className="desc">
              {m.f.contactedAt}: {formatDateTime(workflow.contactedAt)}
              {workflow.assignedTo ? ` · ${m.f.assigned}: ${memberEmail(workflow.assignedTo) ?? '—'}` : ''}
            </p>
          ) : null}
          <InteractionLog
            recordId={row.id}
            entries={log}
            defaultChannel={row.bestChannel}
            onAdded={async (direction) => {
              await refreshLog()
              if (direction === 'out' && (!workflow || ['new', 'selected', 'draft_ready'].includes(workflow.status))) {
                setDraftStatus('contacted')
                await save({ status: 'contacted' })
              } else if (direction === 'in' && workflow && ['new', 'selected', 'draft_ready', 'contacted'].includes(workflow.status)) {
                setDraftStatus('replied')
                await save({ status: 'replied' })
              }
            }}
          />
          {letterOpen ? (
            <LetterDialog
              row={{ ...row, relationType: (draftRelation || null) as Relation | null }}
              onClose={() => setLetterOpen(false)}
              onMarkDraft={async (text) => {
                await crm.addInteraction({ recordId: row.id, direction: 'note', channel: row.bestChannel, summary: text, nextStep: null })
                setDraftStatus('draft_ready')
                await save({ status: 'draft_ready' })
                await refreshLog()
                setLetterOpen(false)
              }}
            />
          ) : null}
        </>
      )}
    </section>
  )
}

function InteractionLog({
  recordId,
  entries,
  defaultChannel,
  onAdded,
}: {
  recordId: string
  entries: Interaction[]
  defaultChannel: LogChannel | null
  onAdded: (direction: Direction) => Promise<void>
}) {
  const crm = useCrm()
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const [direction, setDirection] = useState<Direction>('out')
  const [channel, setChannel] = useState<LogChannel | ''>(defaultChannel ?? '')
  const [summary, setSummary] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!summary.trim()) return
    setPending(true)
    setError(null)
    const result = await crm.addInteraction({
      recordId,
      direction,
      channel: channel || null,
      summary: summary.trim(),
      nextStep: nextStep.trim() || null,
    })
    setPending(false)
    if (result) {
      setError(result)
      return
    }
    setSummary('')
    setNextStep('')
    await onAdded(direction)
  }

  return (
    <div className="interaction-log">
      <h3>{m.work.log}</h3>
      {entries.length === 0 ? (
        <p className="empty">{m.work.logEmpty}</p>
      ) : (
        <ol className="timeline">
          {entries.map((entry) => (
            <li key={entry.id} className={`timeline-item dir-${entry.direction}`}>
              <div className="timeline-meta">
                <strong>{m.direction[entry.direction]}</strong>
                {entry.channel ? ` · ${channelLabel(locale, entry.channel)}` : ''} · {entry.authorEmail ?? '—'} · {formatDateTime(entry.createdAt)}
              </div>
              <p className="timeline-text">{entry.summary}</p>
              {entry.nextStep ? (
                <p className="desc">
                  {m.f.nextStep}: {entry.nextStep}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      <form className="stack" onSubmit={(event) => void submit(event)}>
        <h3>{m.work.addEntry}</h3>
        <div className="filters">
          <label className="field">
            <span>{m.f.direction}</span>
            <select value={direction} onChange={(event) => setDirection(event.target.value as Direction)}>
              {DIRECTIONS.map((value) => (
                <option key={value} value={value}>
                  {m.direction[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{m.f.bestChannel}</span>
            <select value={channel} onChange={(event) => setChannel(event.target.value as LogChannel | '')}>
              <option value="">—</option>
              {LOG_CHANNELS.map((value) => (
                <option key={value} value={value}>
                  {channelLabel(locale, value)}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-grow">
            <span>{m.f.nextStep}</span>
            <input value={nextStep} onChange={(event) => setNextStep(event.target.value)} maxLength={500} />
          </label>
        </div>
        <label className="field">
          <span>{m.work.summary}</span>
          <textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={20000} placeholder={m.work.summaryHint} />
        </label>
        <div className="page-actions">
          <button type="submit" className="btn btn-primary" disabled={pending || !summary.trim()}>
            {pending ? m.work.adding : m.work.add}
          </button>
        </div>
        {error ? <p className="notice notice-error">{error}</p> : null}
      </form>
    </div>
  )
}
