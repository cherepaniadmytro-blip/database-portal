import { useLocale } from '../context/LocaleContext.tsx'
import { recordStatusLabel } from '../lib/labels.ts'
import { normStatus, statusTone } from '../lib/records.ts'

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const { locale } = useLocale()
  const raw = normStatus(status)
  const label = raw ? recordStatusLabel(raw, locale) : '—'
  return (
    <span className={`badge badge-${statusTone(status)}`} title={raw || undefined}>
      {label}
    </span>
  )
}
