import { useLocale } from '../context/LocaleContext.tsx'
import { crmMessages } from '../i18n/crm.ts'
import { memberDisplayName, statusTone, type OutreachStatus, type Relation, type TeamMember, type WorkflowMark } from '../lib/crm.ts'

export function RelationBadge({ relation }: { relation: Relation | null | undefined }) {
  const { locale } = useLocale()
  if (!relation) return null
  return <span className={`rel-badge rel-${relation}`}>{crmMessages(locale).relation[relation]}</span>
}

export function OutreachBadge({ status }: { status: OutreachStatus | null | undefined }) {
  const { locale } = useLocale()
  const value = status ?? 'new'
  return (
    <span className={`badge badge-${statusTone(value)}`} title={crmMessages(locale).statusHelp[value]}>
      {crmMessages(locale).status[value]}
    </span>
  )
}

export function AssigneeBadge({
  assignedTo,
  team,
  currentUserId,
  fallbackEmail,
}: {
  assignedTo: string | null | undefined
  team: TeamMember[]
  currentUserId?: string | null
  fallbackEmail?: string | null
}) {
  const { locale } = useLocale()
  if (!assignedTo) return null
  const m = crmMessages(locale)
  const member = team.find((entry) => entry.id === assignedTo)
  const name = memberDisplayName(team, assignedTo, fallbackEmail)
  const isMe = Boolean(currentUserId && assignedTo === currentUserId)
  return (
    <span className={`assignee-badge ${isMe ? 'assignee-me' : ''}`} title={member?.email ?? fallbackEmail ?? assignedTo}>
      {m.work.workingWith(name)}
    </span>
  )
}

export function MarksBadges({ marks }: { marks: readonly WorkflowMark[] | null | undefined }) {
  const { locale } = useLocale()
  if (!marks || marks.length === 0) return null
  const m = crmMessages(locale)
  return (
    <>
      {marks.map((mark) => (
        <span key={mark} className="mark-chip" title={m.marksHelp[mark]}>
          ✓ {m.marks[mark]}
        </span>
      ))}
    </>
  )
}
