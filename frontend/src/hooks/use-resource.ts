import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((value) => value + 1), [])
  useEffect(() => {
    if (!path) {
      setLoading(false)
      setData(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api<T>(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [path, version])
  return { data, loading, error, reload }
}
