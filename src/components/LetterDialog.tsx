import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from '../context/LocaleContext.tsx'
import { crmMessages } from '../i18n/crm.ts'
import { TEMPLATE_IDS, defaultTemplate, fillTemplate, type TemplateId, type TemplateLang } from '../lib/crm.ts'
import type { PublicRecord } from '../lib/catalog.ts'

const SENDER_KEY = 'database-portal-sender-name'

/** Copy-only letter preparation. Nothing is sent from the portal. */
export function LetterDialog({
  row,
  onClose,
  onMarkDraft,
}: {
  row: PublicRecord
  onClose: () => void
  onMarkDraft?: (text: string) => void
}) {
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const dialog = useRef<HTMLDialogElement>(null)
  const [template, setTemplate] = useState<TemplateId>(() => defaultTemplate(row.relationType, row.entityType))
  const [lang, setLang] = useState<TemplateLang>('uk')
  const [sender, setSender] = useState(() => {
    try {
      return localStorage.getItem(SENDER_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [contact, setContact] = useState('')
  const [date, setDate] = useState('')
  const generated = useMemo(
    () =>
      fillTemplate(template, lang, {
        name: row.name,
        city: row.city ?? row.place,
        languageGroup: row.languageGroup,
        contactName: contact,
        senderName: sender,
        date,
      }),
    [template, lang, row, contact, sender, date],
  )
  const [text, setText] = useState(generated)
  const [copied, setCopied] = useState(false)

  useEffect(() => setText(generated), [generated])
  useEffect(() => {
    const node = dialog.current
    if (node && !node.open) node.showModal()
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(SENDER_KEY, sender)
    } catch {
      /* ignore */
    }
  }, [sender])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const area = document.getElementById('letter-text') as HTMLTextAreaElement | null
      area?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <dialog ref={dialog} className="letter-dialog" onClose={onClose} aria-labelledby="letter-title">
      <form method="dialog" className="stack" onSubmit={(event) => event.preventDefault()}>
        <header className="letter-head">
          <h2 id="letter-title">
            {m.letter.title}: {row.name}
          </h2>
          <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()}>
            {m.letter.close}
          </button>
        </header>
        <div className="filters">
          <label className="field">
            <span>{m.letter.template}</span>
            <select value={template} onChange={(event) => setTemplate(event.target.value as TemplateId)}>
              {TEMPLATE_IDS.map((id) => (
                <option key={id} value={id}>
                  {m.template[id]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{m.letter.lang}</span>
            <select value={lang} onChange={(event) => setLang(event.target.value as TemplateLang)}>
              <option value="uk">Українська</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
          <label className="field">
            <span>{m.letter.sender}</span>
            <input value={sender} onChange={(event) => setSender(event.target.value)} />
          </label>
          <label className="field">
            <span>{m.letter.contact}</span>
            <input value={contact} placeholder={m.letter.contactHint} onChange={(event) => setContact(event.target.value)} />
          </label>
          {template === 'followup' ? (
            <label className="field">
              <span>{m.letter.date}</span>
              <input value={date} placeholder="01.12.2026" onChange={(event) => setDate(event.target.value)} />
            </label>
          ) : null}
        </div>
        <textarea id="letter-text" className="letter-text" rows={12} value={text} onChange={(event) => setText(event.target.value)} />
        <p className="desc">{m.letter.rules}</p>
        <p className="desc">{m.work.noSend}</p>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => void copy()}>
            {copied ? m.letter.copied : m.letter.copy}
          </button>
          {onMarkDraft ? (
            <button type="button" className="btn btn-ghost" onClick={() => onMarkDraft(text)}>
              {m.letter.markDraft}
            </button>
          ) : null}
        </div>
      </form>
    </dialog>
  )
}
