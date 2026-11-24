import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { useAuth } from '../context/AuthContext.tsx'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState<'link' | 'code' | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inviteOnly, setInviteOnly] = useState(false)

  async function sendLink(event: FormEvent) {
    event.preventDefault()
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
    setInfo('Лист надіслано. Відкрийте посилання або введіть код нижче, якщо він є в листі.')
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

  if (auth.email) {
    return (
      <>
        <PageHeader title="Вхід" meta="Сесія вже відкрита." />
        <section className="login-card panel">
          <p>
            Ви увійшли як <strong>{auth.email}</strong>.
          </p>
          <div className="page-actions">
            <Link className="btn btn-primary" to="/">
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
      <PageHeader title="Вхід" meta="Лист із посиланням або одноразовим кодом. Без входу відкрита публічна частина." />
      <section className="login-card panel">
        <form onSubmit={(event) => void sendLink(event)} className="stack">
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
          <button className="btn btn-primary" type="submit" disabled={pending !== null}>
            {pending === 'link' ? 'Надсилання…' : 'Надіслати посилання'}
          </button>
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
        <form onSubmit={(event) => void verify(event)} className="stack code-form">
          <label className="field">
            <span>Код із листа</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,}"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6 цифр"
            />
          </label>
          <button className="btn btn-ghost" type="submit" disabled={pending !== null || code.trim().length < 6 || !email.trim()}>
            {pending === 'code' ? 'Перевірка…' : 'Увійти кодом'}
          </button>
        </form>
        <p className="desc">Посилання веде на цей портал і відкриває сесію. Код потрібен, якщо шаблон листа містить одноразовий пароль.</p>
      </section>
    </>
  )
}
