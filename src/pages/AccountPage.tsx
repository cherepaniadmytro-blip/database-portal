import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { crmMessages } from '../i18n/crm.ts'
import { supabase } from '../lib/supabase.ts'

/** Lets a signed-in user set a display name for the team and a password so later sign-ins need no e-mail. */
export function AccountPage() {
  const auth = useAuth()
  const crm = useCrm()
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const myMember = crm.team.find((member) => member.id === auth.session?.user.id)
  const [displayName, setDisplayName] = useState(myMember?.display_name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    setDisplayName(myMember?.display_name ?? '')
  }, [myMember?.display_name])

  if (!auth.session) {
    return (
      <>
        <PageHeader title={m.account.title} />
        <Link className="btn btn-primary" to="/login">
          {m.account.signIn}
        </Link>
      </>
    )
  }

  async function submitName(event: FormEvent) {
    event.preventDefault()
    setSavingName(true)
    setNameMessage(null)
    const err = await crm.updateDisplayName(displayName)
    setSavingName(false)
    setNameMessage(err ? { ok: false, text: err } : { ok: true, text: m.account.displayNameSaved })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 10) return setMessage({ ok: false, text: m.account.short })
    if (password !== password2) return setMessage({ ok: false, text: m.account.mismatch })
    setPending(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPending(false)
    setPassword('')
    setPassword2('')
    setMessage(error ? { ok: false, text: error.message } : { ok: true, text: m.account.saved })
  }

  return (
    <>
      <PageHeader title={m.account.title} meta={m.account.meta} />
      <div className="stack">
        {crm.canEdit ? (
          <section className="login-card panel">
            <h2>{m.account.profileSection}</h2>
            <p className="desc">
              <strong>{auth.email}</strong>
            </p>
            <p className="desc">{m.account.displayNameHint}</p>
            <form className="stack" onSubmit={(event) => void submitName(event)}>
              <label className="field">
                <span>{m.account.displayName}</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={80}
                  placeholder={m.account.displayNamePlaceholder}
                />
              </label>
              <div className="page-actions">
                <button className="btn btn-primary" type="submit" disabled={savingName}>
                  {m.account.displayNameSave}
                </button>
              </div>
            </form>
            {nameMessage ? <p className={`notice ${nameMessage.ok ? 'notice-ok' : 'notice-error'}`}>{nameMessage.text}</p> : null}
          </section>
        ) : null}

        <section className="login-card panel">
          <h2>{m.account.passwordSection}</h2>
          <p>
            <strong>{auth.email}</strong>
          </p>
          <form className="stack" onSubmit={(event) => void submit(event)}>
            <label className="field">
              <span>{m.account.password}</span>
              <input type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <label className="field">
              <span>{m.account.password2}</span>
              <input type="password" autoComplete="new-password" minLength={10} value={password2} onChange={(event) => setPassword2(event.target.value)} required />
            </label>
            <div className="page-actions">
              <button className="btn btn-primary" type="submit" disabled={pending}>
                {m.account.save}
              </button>
            </div>
          </form>
          {message ? <p className={`notice ${message.ok ? 'notice-ok' : 'notice-error'}`}>{message.text}</p> : null}
        </section>
      </div>
    </>
  )
}
