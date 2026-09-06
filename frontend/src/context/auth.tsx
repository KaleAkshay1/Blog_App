import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, type User } from '@/lib/api'
import { toast } from 'sonner'

type AuthContextValue = {
  user: User | null
  loading: boolean
  setUser: (user: User) => void
  authMode: 'login' | 'register' | null
  destination: string | null
  openAuth: (mode?: 'login' | 'register', destination?: string) => void
  closeAuth: () => void
  logout: () => Promise<void>
  toggleBookmark: (id: string) => Promise<void>
}
const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
  const [destination, setDestination] = useState<string | null>(null)
  const bookmarkRequests = useRef(new Set<string>())
  useEffect(() => {
    let active = true
    api<{ user: User | null }>('/auth/me')
      .then((data) => {
        if (active) setUser(data.user)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  const openAuth = (mode: 'login' | 'register' = 'login', path?: string) => {
    setAuthMode(mode)
    setDestination(path || null)
  }
  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
      setUser(null)
      toast.success('You’ve been signed out.')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }
  const toggleBookmark = async (id: string) => {
    if (!user) {
      openAuth('login')
      return
    }
    if (bookmarkRequests.current.has(id)) return
    bookmarkRequests.current.add(id)
    const saved = !user.bookmarks.includes(id)
    try {
      await api<{ bookmarks: string[] }>(`/bookmarks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ saved }),
      })
      setUser((current) =>
        current
          ? {
              ...current,
              bookmarks: saved
                ? [...new Set([...current.bookmarks, id])]
                : current.bookmarks.filter((item) => item !== id),
            }
          : null,
      )
      toast.success(saved ? 'Added to your reading list.' : 'Removed from your reading list.')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      bookmarkRequests.current.delete(id)
    }
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        authMode,
        destination,
        openAuth,
        closeAuth: () => setAuthMode(null),
        logout,
        toggleBookmark,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
