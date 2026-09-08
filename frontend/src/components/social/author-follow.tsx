import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, UserMinus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import { useResource } from '@/hooks/use-resource'
import { api, type Author, type FollowSummary } from '@/lib/api'

function LoadingFollows() {
  return (
    <span role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
      <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
      Loading follows...
    </span>
  )
}

export function AuthorFollow({ author }: { author: Author }) {
  const { user, loading } = useAuth()
  if (!author.id) return null
  if (loading) return <LoadingFollows />

  // Session changes reset viewer-specific data and cancel outstanding requests.
  return <FollowControls key={`${author.id}:${user?.id || 'guest'}`} author={author} />
}

function FollowControls({ author }: { author: Author }) {
  const { user, openAuth } = useAuth()
  const path = `/users/${author.id}/follow`
  const { data, loading, error, reload } = useResource<FollowSummary>(path)
  const [summary, setSummary] = useState<FollowSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const request = useRef<AbortController | null>(null)

  useEffect(() => {
    if (data) setSummary(data)
  }, [data])

  useEffect(() => () => request.current?.abort(), [])

  const toggleFollow = async () => {
    if (!user) {
      openAuth('login')
      return
    }
    if (!summary || request.current || user.id === author.id) return

    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setActionError('')
    try {
      const result = await api<FollowSummary>(path, {
        method: summary.followedByMe ? 'DELETE' : 'PUT',
        signal: controller.signal,
      })
      if (!controller.signal.aborted) setSummary(result)
    } catch (err) {
      if (!controller.signal.aborted) {
        setActionError((err as Error).message)
        // The server may have saved the change before the connection failed.
        reload()
      }
    } finally {
      request.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-red-700">
        <span>{error}</span>
        <Button type="button" size="sm" variant="ghost" onClick={reload}>
          Retry follows
        </Button>
      </div>
    )
  }
  if (loading || !summary) return <LoadingFollows />

  const isSelf = user?.id === author.id
  return (
    <div className="flex flex-col items-center gap-2">
      {!isSelf && (
        <Button
          type="button"
          size="sm"
          variant={summary.followedByMe ? 'outline' : 'default'}
          disabled={busy}
          aria-label={`${summary.followedByMe ? 'Unfollow' : 'Follow'} ${author.name}`}
          onClick={toggleFollow}
        >
          {busy ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : summary.followedByMe ? (
            <UserMinus aria-hidden="true" />
          ) : (
            <UserPlus aria-hidden="true" />
          )}
          {summary.followedByMe ? 'Unfollow' : 'Follow'}
        </Button>
      )}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="flex flex-wrap justify-center gap-x-2 text-xs text-muted-foreground"
      >
        <span>
          {summary.followerCount.toLocaleString()}{' '}
          {summary.followerCount === 1 ? 'follower' : 'followers'}
        </span>
        <span aria-hidden="true">/</span>
        <span>{summary.followingCount.toLocaleString()} following</span>
      </p>
      {actionError && (
        <p role="alert" className="max-w-xs text-center text-xs text-red-700">
          {actionError}
        </p>
      )}
    </div>
  )
}
