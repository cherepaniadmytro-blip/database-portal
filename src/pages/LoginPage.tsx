import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { authRedirectTo } from '../lib/supabase.ts'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
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
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo('Лист надіслано. Введіть 6 цифр із листа. Посилання в листі теж відкриє сесію.')
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
        <PageHeader title="Вхід" meta="Сесія вже відкрита." />
        <section className="login-card panel">
          <p>
            Ви увійшли як <strong>{auth.email}</strong>.
          </p>
          <div className="page-actions">
            <Link className="btn btn-primary" to={{ pathname: '/', hash: '' }}>
              До каталогу
            </Link>
            <Link className="btn btn-ghost" to="/dashboard">
              На панель
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => void auth.signOut()}>
              Вийти
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Вхід"
        meta="Необов'язково. Каталог відкритий без входу. Для власника — 6-значний код з листа."
      />
      <section className="login-card panel">
        <form
          onSubmit={(event) => void verify(event)}
          className="stack"
        >
          <label className="field">
            <span>Ел. пошта</span>
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
            <span>Код із 6 цифр</span>
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
              {pending === 'code' ? 'Перевірка…' : 'Увійти кодом'}
            </button>
            <button className="btn btn-ghost" type="button" disabled={pending !== null || !email.trim()} onClick={() => void sendLink()}>
              {pending === 'link' ? 'Надсилання…' : 'Надіслати код'}
            </button>
          </div>
        </form>
        {inviteOnly ? (
          <div className="invite-only" role="alert">
            <strong>Реєстрація лише за запрошенням</strong>
            <p>Цієї адреси немає в списку invited_emails. Власник має додати її в адмініструванні, після цього вхід спрацює.</p>
            <p className="mono invite-code">Sign-up is invite-only</p>
          </div>
        ) : error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        {info ? <p className="notice notice-ok">{info}</p> : null}
        <p className="desc">
          Введіть 6 цифр із листа. Посилання в тому ж листі відкриває{' '}
          <span className="mono">{redirectTo}</span>.
        </p>
      </section>
    </>
  )
}
