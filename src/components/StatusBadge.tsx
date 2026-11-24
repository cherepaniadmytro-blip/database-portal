import { normStatus, statusTone } from '../lib/records.ts'

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = normStatus(status) || '—'
  return <span className={`badge badge-${statusTone(status)}`}>{label}</span>
}
