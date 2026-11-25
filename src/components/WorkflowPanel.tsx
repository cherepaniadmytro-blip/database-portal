import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { channelLabel, crmMessages } from '../i18n/crm.ts'
import {
  DIRECTIONS,
  LOG_CHANNELS,
  MARKS,
  RELATIONS,
  STATUSES,
  WORK_STATUSES,
  isChannel,
  isMark,
  isRelation,
  displayMemberName,
  isStatus,
  memberDisplayName,
  normalizeWorkflowStatus,
  statusTone,
  type Channel,
  type Direction,
  type Interaction,
  type LogChannel,
  type OutreachStatus,
  type Relation,
  type WorkflowEvent,
  type WorkflowMark,
} from '../lib/crm.ts'
import { formatDateTime } from '../lib/records.ts'
import { AssigneeBadge, MarksBadges, OutreachBadge, RelationBadge } from './CrmBadges.tsx'
import { LetterDialog } from './LetterDialog.tsx'

export type WorkflowTarget = {
  id: string
  name: string
  city: string | null
  place: string | null
  languageGroup: string | null
  entityType: string | null
  relationType: Relation | null
  suggestedRelationType: Relation | null
  relationReason: string | null
  bestChannel: Channel | null
  channelReason: string | null
}

/** Relation / channel facts for everyone; workflow editing, marks, ownership and logs for the signed-in team only. */
export function WorkflowPanel({ row }: { row: WorkflowTarget }) {
  const auth = useAuth()
  const crm = useCrm()
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const workflow = crm.workflows.get(row.id)
  const relation = workflow?.relationType ?? row.relationType ?? row.suggestedRelationType

  const [draftRelation, setDraftRelation] = useState<Relation | ''>(relation ?? '')
  const [draftStatus, setDraftStatus] = useState<OutreachStatus>(workflow?.status ?? 'new')
  const [draftMarks, setDraftMarks] = useState<WorkflowMark[]>(workflow?.marks ?? [])
  const [draftAssigned, setDraftAssigned] = useState<string>(workflow?.assignedTo ?? '')
  const [draftNext, setDraftNext] = useState<string>(workflow?.nextStep ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [letterOpen, setLetterOpen] = useState(false)
  const [log, setLog] = useState<Interaction[]>([])
  const [events, setEvents] = useState<WorkflowEvent[]>([])

  useEffect(() => {
    setDraftRelation(relation ?? '')
    setDraftStatus(workflow?.status ?? 'new')
    setDraftMarks(workflow?.marks ?? [])
    setDraftAssigned(workflow?.assignedTo ?? '')
    setDraftNext(workflow?.nextStep ?? '')
  }, [relation, workflow?.status, workflow?.marks, workflow?.assignedTo, workflow?.nextStep])

  const refreshHistory = useCallback(async () => {
    if (!crm.canEdit) {
      setLog([])
      setEvents([])
      return
    }
    const [interactions, recordEvents] = await Promise.all([crm.loadInteractions(row.id), crm.loadRecordEvents(row.id, 60)])
    setLog(interactions)
    setEvents(recordEvents)
  }, [crm, row.id])

  useEffect(() => {
    void refreshHistory()
  }, [refreshHistory])

  async function save(patch?: {
    relationType?: Relation | null
    status?: OutreachStatus
    marks?: WorkflowMark[]
    assignedTo?: string | null
  }) {
    setSaving(true)
    setMessage(null)
    const nextRelation = patch && 'relationType' in patch ? patch.relationType : (draftRelation || null)
    const nextStatus = patch?.status ?? draftStatus
    const nextMarks = patch?.marks ?? draftMarks
    const nextAssigned = patch && 'assignedTo' in patch ? patch.assignedTo : (draftAssigned || null)
    const error = await crm.save(row.id, {
      relationType: nextRelation,
      status: nextStatus,
      marks: nextMarks,
      assignedTo: nextAssigned,
      nextStep: draftNext.trim() || null,
    })
    setSaving(false)
    setMessage(error ?? m.work.saved)
    if (!error) await refreshHistory()
  }

  async function handleTakeWork() {
    setSaving(true)
    setMessage(null)
    const error = await crm.takeOwnership(row.id, (draftRelation || null) as Relation | null)
    setSaving(false)
    setMessage(error ?? m.work.saved)
    if (!error) await refreshHistory()
  }

  async function handleRelationTick(target: Relation) {
    const next: Relation | null = draftRelation === target ? null : target
    setDraftRelation(next ?? '')
    await save({ relationType: next })
  }

  async function handleStatusClick(target: OutreachStatus) {
    setDraftStatus(target)
    await save({ status: target })
  }

  async function handleMarkToggle(mark: WorkflowMark, checked: boolean) {
    const nextSet = new Set(draftMarks)
    if (checked) nextSet.add(mark)
    else nextSet.delete(mark)
    const nextMarks = MARKS.filter((item) => nextSet.has(item))
    let nextStatus = draftStatus
    if (checked && mark === 'joined_group' && draftStatus === 'new') {
      nextStatus = 'started'
    } else if (checked && mark === 'letter_sent' && ['new', 'started', 'reviewed'].includes(draftStatus)) {
      nextStatus = 'contacted'
    }
    setDraftMarks(nextMarks)
    setDraftStatus(nextStatus)
    await save({ marks: nextMarks, status: nextStatus })
  }

  const memberName = (id: string | null | undefined) => memberDisplayName(crm.team, id)
  const isMine = Boolean(crm.userId && workflow?.assignedTo === crm.userId)

  const translateValue = (value: string | null): string | null => {
    if (!value) return value
    if (isStatus(value)) return m.status[value]
    if (['selected', 'draft_ready', 'agreed'].includes(value)) return m.status[normalizeWorkflowStatus(value)]
    if (isRelation(value)) return m.relation[value]
    if (isChannel(value)) return channelLabel(locale, value)
    if (value.includes("@")) return memberDisplayName(crm.team, null, value)
    if (value.includes(',') || isMark(value)) {
      const parts = value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => (isMark(part) ? m.marks[part] : part))
      return parts.join(', ') || '—'
    }
    return value
  }

  const translateEvent = (event: WorkflowEvent): string => {
    if (event.event === 'created') {
      const parts = (event.newValue ?? '').split(' | ').map((part) => translateValue(part.trim()) ?? part)
      return m.activity.event('created', null, parts.join(' · '))
    }
    return m.activity.event(event.event, translateValue(event.oldValue), translateValue(event.newValue))
  }

  const statusEvents = events.filter((event) => !event.event.startsWith('interaction_'))

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
            <AssigneeBadge assignedTo={workflow?.assignedTo} team={crm.team} currentUserId={crm.userId} />
            <MarksBadges marks={workflow?.marks} />
            {!isMine ? (
              <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={() => void handleTakeWork()}>
                {workflow?.assignedTo ? m.work.takeOver : m.work.takeWork}
              </button>
            ) : (
              <span className="desc ok-text">{m.work.youWork}</span>
            )}
            {workflow?.updatedAt ? (
              <span className="desc">{m.f.updatedBy(memberDisplayName(crm.team, workflow.updatedBy, workflow.updatedByEmail), formatDateTime(workflow.updatedAt))}</span>
            ) : null}
          </div>

          <div className="workflow-block">
            <div className="workflow-block-head">
              <strong>{m.f.relation}</strong>
              {draftRelation ? (
                <Link className="text-link" to={`/pipeline?type=${encodeURIComponent(draftRelation)}`}>
                  {m.work.movedToTab(m.relationPlural[draftRelation])} · {m.work.openTab}
                </Link>
              ) : null}
            </div>
            <div className="tick-group" role="group" aria-label={m.f.relation}>
              {RELATIONS.map((value) => {
                const checked = draftRelation === value
                return (
                  <label key={value} className={`tick-pill rel-pill-${value} ${checked ? 'checked' : ''}`}>
                    <input type="checkbox" checked={checked} disabled={saving} onChange={() => void handleRelationTick(value)} />
                    <span>{m.relation[value]}</span>
                    {value === row.suggestedRelationType ? <em className="tick-suggested">({m.f.suggested})</em> : null}
                  </label>
                )
              })}
            </div>
            <p className="desc">{m.work.relationTicksHint}</p>
          </div>

          <div className="workflow-block">
            <strong>{m.work.stageLabel}</strong>
            <div className="stage-pills" role="group" aria-label={m.f.outreach}>
              {WORK_STATUSES.map((value) => {
                const active = draftStatus === value
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={saving}
                    className={`stage-btn tone-${statusTone(value)} ${active ? 'active' : ''}`}
                    title={m.statusHelp[value]}
                    onClick={() => void handleStatusClick(value)}
                  >
                    {m.status[value]}
                  </button>
                )
              })}
              {draftStatus !== 'new' ? (
                <button
                  type="button"
                  disabled={saving}
                  className="stage-btn tone-neutral"
                  title={m.statusHelp.new}
                  onClick={() => void handleStatusClick('new')}
                >
                  {m.status.new}
                </button>
              ) : null}
            </div>
          </div>

          <div className="workflow-block">
            <strong>{m.work.quickMarksLabel}</strong>
            <div className="tick-group" role="group" aria-label={m.work.quickMarksLabel}>
              {MARKS.map((mark) => {
                const checked = draftMarks.includes(mark)
                return (
                  <label key={mark} className={`tick-pill ${checked ? 'checked' : ''}`} title={m.marksHelp[mark]}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={saving}
                      onChange={(event) => void handleMarkToggle(mark, event.target.checked)}
                    />
                    <span>{m.marks[mark]}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <form
            className="filters workflow-form"
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              void save()
            }}
          >
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
                    {displayMemberName(member.email, member.display_name)}
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
          {message ? (
            <p className="desc" role="status">
              {message}
            </p>
          ) : null}
          {workflow?.contactedAt ? (
            <p className="desc">
              {m.f.contactedAt}: {formatDateTime(workflow.contactedAt)}
              {workflow.assignedTo ? ` · ${m.f.assigned}: ${memberName(workflow.assignedTo) ?? '—'}` : ''}
            </p>
          ) : null}

          <InteractionLog
            recordId={row.id}
            entries={log}
            defaultChannel={row.bestChannel}
            onAdded={async (direction) => {
              if (direction === 'out') {
                const nextMarks = draftMarks.includes('letter_sent') ? draftMarks : [...draftMarks, 'letter_sent' as WorkflowMark]
                const nextStatus = !workflow || ['new', 'started', 'reviewed'].includes(workflow.status) ? 'contacted' : draftStatus
                setDraftMarks(nextMarks)
                setDraftStatus(nextStatus)
                await save({ status: nextStatus, marks: nextMarks })
              } else if (direction === 'in' && workflow && ['new', 'started', 'reviewed', 'contacted'].includes(workflow.status)) {
                setDraftStatus('replied')
                await save({ status: 'replied' })
              } else {
                await refreshHistory()
              }
            }}
          />

          <div className="interaction-log">
            <h3>{m.work.statusHistoryTitle}</h3>
            {statusEvents.length === 0 ? (
              <p className="empty">{m.work.statusHistoryEmpty}</p>
            ) : (
              <ol className="timeline">
                {statusEvents.map((event) => (
                  <li key={event.id} className="timeline-item">
                    <div className="timeline-meta">
                      {formatDateTime(event.createdAt)} · <strong>{memberDisplayName(crm.team, null, event.actorEmail)}</strong>
                    </div>
                    <p className="timeline-text">{translateEvent(event)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {letterOpen ? (
            <LetterDialog
              row={{ ...row, relationType: (draftRelation || null) as Relation | null }}
              onClose={() => setLetterOpen(false)}
              onMarkDraft={async (text) => {
                await crm.addInteraction({ recordId: row.id, direction: 'note', channel: row.bestChannel, summary: text, nextStep: null })
                const nextStatus = ['new', 'started'].includes(draftStatus) ? 'reviewed' : draftStatus
                setDraftStatus(nextStatus)
                await save({ status: nextStatus })
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
                {entry.channel ? ` · ${channelLabel(locale, entry.channel)}` : ''} · {memberDisplayName(crm.team, entry.authorId, entry.authorEmail)} · {formatDateTime(entry.createdAt)}
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
