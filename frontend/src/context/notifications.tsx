import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from '@/context/auth'
import { api, type NotificationPage } from '@/lib/api'

const NotificationContext = createContext<{ unreadCount: number; refresh: () => void } | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((value) => value + 1), [])

  useEffect(() => {
    setUnreadCount(0)
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    let controller: AbortController | null = null
    const update = async () => {
      if (document.hidden) return
      controller?.abort()
      controller = new AbortController()
      const current = controller
      try {
        const result = await api<NotificationPage>('/notifications?limit=1', {
          signal: current.signal,
        })
        if (!current.signal.aborted) setUnreadCount(result.unreadCount)
      } catch {
        // Keep the last known count. The full page displays connection errors.
      }
    }
    void update()
    const timer = window.setInterval(() => void update(), 30_000)
    const onFocus = () => void update()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      controller?.abort()
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [user?.id, version])

  return (
    <NotificationContext.Provider value={{ unreadCount: user ? unreadCount : 0, refresh }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const value = useContext(NotificationContext)
  if (!value) throw new Error('useNotifications requires NotificationProvider')
  return value
}
