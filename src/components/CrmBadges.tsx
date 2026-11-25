import { useLocale } from '../context/LocaleContext.tsx'
import { crmMessages } from '../i18n/crm.ts'
import { statusTone, type OutreachStatus, type Relation } from '../lib/crm.ts'

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
