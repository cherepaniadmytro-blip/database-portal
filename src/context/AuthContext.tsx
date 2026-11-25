import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authRedirectTo, isInviteOnlyError, isRateLimitError, supabase } from '../lib/supabase.ts'
import type { Role } from '../lib/types.ts'

type AuthResult = { error: string | null; inviteOnly: boolean; rateLimited: boolean }

type AuthValue = {
  ready: boolean
  session: Session | null
  email: string | null
  role: Role
  notice: string | null
  clearNotice: () => void
  sendLink: (email: string) => Promise<AuthResult>
  verifyCode: (email: string, token: string) => Promise<AuthResult>
  signInPassword: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

function asRole(value: unknown): Role {
  if (value === 'owner' || value === 'partner' || value === 'public' || value === 'none') return value
  return 'none'
}

function describe(error: { message: string; code?: string } | null): AuthResult {
  if (!error) return { error: null, inviteOnly: false, rateLimited: false }
  if (isInviteOnlyError(error)) return { error: error.message, inviteOnly: true, rateLimited: false }
  if (isRateLimitError(error)) return { error: error.message, inviteOnly: false, rateLimited: true }
  return { error: error.message, inviteOnly: false, rateLimited: false }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [role, setRole] = useState<Role>('public')
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const description = hash.get('error_description')
    if (description) setNotice(description.replace(/\+/g, ' '))

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session === undefined ? undefined : (session?.user.id ?? null)

  useEffect(() => {
    if (userId === undefined) return
    let cancel = false
    if (userId === null) {
      setRole('public')
      setReady(true)
      return
    }
    ;(async () => {
      const { data, error } = await supabase.rpc('app_role')
      if (cancel) return
      setRole(error ? 'none' : asRole(data))
      setReady(true)
    })()
    return () => {
      cancel = true
    }
  }, [userId])

  const sendLink = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: authRedirectTo(),
        shouldCreateUser: true,
      },
    })
    return describe(error)
  }, [])

  const verifyCode = useCallback(async (email: string, token: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    })
    return describe(error)
  }, [])

  const signInPassword = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    return describe(error)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      session: session ?? null,
      email: session?.user.email ?? null,
      role,
      notice,
      clearNotice: () => setNotice(null),
      sendLink,
      verifyCode,
      signInPassword,
      signOut,
    }),
    [ready, session, role, notice, sendLink, verifyCode, signInPassword, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth поза AuthProvider')
  return value
}
