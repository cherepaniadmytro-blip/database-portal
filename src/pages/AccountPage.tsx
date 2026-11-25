import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { crmMessages } from '../i18n/crm.ts'
import { supabase } from '../lib/supabase.ts'

/** Lets a signed-in user set a password so later sign-ins need no e-mail (free-tier e-mail cap). */
export function AccountPage() {
  const auth = useAuth()
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

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
      <section className="login-card panel">
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
    </>
  )
}
