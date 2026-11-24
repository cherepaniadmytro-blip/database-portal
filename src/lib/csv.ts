import { FIELDS } from './records.ts'
import type { RecordRow } from './types.ts'

function csvCell(value: unknown): string {
  if (value == null) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function recordsToCsv(rows: RecordRow[]): string {
  const header = FIELDS.map((field) => csvCell(field.label)).join(',')
  const lines = rows.map((row) => FIELDS.map((field) => csvCell(row[field.key])).join(','))
  return `\uFEFF${[header, ...lines].join('\r\n')}`
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
