import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useT } from '../context/LocaleContext.tsx'
import { authRedirectTo } from '../lib/supabase.ts'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const t = useT()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState<'link' | 'code' | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inviteOnly, setInviteOnly] = useState(false)

  async function sendLink() {
    setPending('link')
    setError(null)
    setInfo(null)
    setInviteOnly(false)
    const result = await auth.sendLink(email)
    setPending(null)
    if (result.inviteOnly) {
      setInviteOnly(true)
      setError(result.error)
      return
    }
    if (result.rateLimited) {
      setError(t.auth.rateLimit)
      return
    }
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo(t.auth.sent)
  }

  async function verify(event: FormEvent) {
    event.preventDefault()
    setPending('code')
    setError(null)
    setInviteOnly(false)
    const result = await auth.verifyCode(email, code)
    setPending(null)
    if (result.inviteOnly) {
      setInviteOnly(true)
      setError(result.error)
      return
    }
    if (result.rateLimited) {
      setError(t.auth.rateLimit)
      return
    }
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/')
  }

  const redirectTo = authRedirectTo()

  if (auth.email) {
    return (
      <>
        <PageHeader title={t.auth.title} meta={t.auth.alreadyMeta} />
        <section className="login-card panel">
          <p>
            {t.auth.signedInAs} <strong>{auth.email}</strong>.
          </p>
          <div className="page-actions">
            <Link className="btn btn-primary" to={{ pathname: '/', hash: '' }}>
              {t.auth.toCatalog}
            </Link>
            <Link className="btn btn-ghost" to="/dashboard">
              {t.auth.toDashboard}
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => void auth.signOut()}>
              {t.logout}
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t.auth.title} meta={t.auth.meta} />
      <section className="login-card panel">
        <form
          onSubmit={(event) => void verify(event)}
          className="stack"
        >
          <label className="field">
            <span>{t.auth.email}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <label className="field">
            <span>{t.auth.code}</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
            />
          </label>
          <div className="page-actions">
            <button className="btn btn-primary" type="submit" disabled={pending !== null || code.trim().length < 6 || !email.trim()}>
              {pending === 'code' ? t.auth.verifying : t.auth.submitCode}
            </button>
            <button className="btn btn-ghost" type="button" disabled={pending !== null || !email.trim()} onClick={() => void sendLink()}>
              {pending === 'link' ? t.auth.sending : t.auth.sendLink}
            </button>
          </div>
        </form>
        {inviteOnly ? (
          <div className="invite-only" role="alert">
            <strong>{t.auth.inviteTitle}</strong>
            <p>{t.auth.inviteBody}</p>
            <p className="mono invite-code">Sign-up is invite-only</p>
          </div>
        ) : error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        {info ? <p className="notice notice-ok">{info}</p> : null}
        <p className="desc">
          {t.auth.hint}{' '}
          <span className="mono">{redirectTo}</span>.
        </p>
      </section>
    </>
  )
}
