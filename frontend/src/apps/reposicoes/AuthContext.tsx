import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser } from './types'

interface AuthContextValue {
  user: AuthUser | null
  signIn: (user: AuthUser) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const signIn = useCallback((u: AuthUser) => {
    localStorage.setItem('token', u.token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
