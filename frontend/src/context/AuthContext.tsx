import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthResponse, User } from '../types'
import { AUTH_EXPIRED_EVENT, AUTH_KEY, authApi, readAuth } from '../lib/api'
import { AuthContext } from './auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [saved] = useState(readAuth)
  const [user, setUser] = useState<User | null>(saved?.user || null)
  const [loading, setLoading] = useState(Boolean(saved))

  useEffect(() => {
    let active = true
    const clear = () => {
      setUser(null)
      setLoading(false)
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, clear)
    if (saved) {
      authApi
        .me()
        .then((value) => {
          if (active) setUser(value)
        })
        .catch(() => {
          if (active) setUser(null)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }
    return () => {
      active = false
      window.removeEventListener(AUTH_EXPIRED_EVENT, clear)
    }
  }, [saved])

  function accept(auth: AuthResponse) {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    setUser(auth.user)
  }

  async function login(email: string, password: string) {
    accept(await authApi.login(email, password))
  }
  async function register(name: string, email: string, password: string) {
    accept(await authApi.register(name, email, password))
  }
  function logout() {
    sessionStorage.removeItem(AUTH_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
