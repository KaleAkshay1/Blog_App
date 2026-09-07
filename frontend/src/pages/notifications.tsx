import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Heart, MessageCircle, Reply, Send, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { api, type NotificationPage, type StoryNotification } from '@/lib/api'
import { useResource } from '@/hooks/use-resource'
import { useNotifications } from '@/context/notifications'
import { Avatar } from '@/components/story-card'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, Loading } from '@/components/feedback'
import { cn, formatDate } from '@/lib/utils'

const activity = {
  like: { icon: Heart, text: 'liked your story' },
  comment: { icon: MessageCircle, text: 'commented on your story' },
  reply: { icon: Reply, text: 'replied in a conversation on' },
  share: { icon: Send, text: 'shared a story with you' },
}

export default function Notifications() {
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const { refresh } = useNotifications()
  const { data, loading, error, reload } = useResource<NotificationPage>(
    '/notifications?page=' + page,
  )
  useEffect(() => {
    document.title = 'Notifications — Story'
  }, [])
  useEffect(() => {
    if (data && page > Math.max(1, data.pages)) setPage(Math.max(1, data.pages))
  }, [data, page])
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) reload()
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [reload])
  const read = async (notification: StoryNotification) => {
    if (notification.readAt) return
    try {
      await api('/notifications/' + notification.id + '/read', { method: 'PATCH' })
      refresh()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }
  const readAll = async () => {
    if (busy) return
    setBusy(true)
    try {
      await api('/notifications/read-all', { method: 'PATCH' })
      refresh()
      reload()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-shell py-12">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3">YOUR STORY COMMUNITY</p>
            <h1 className="font-serif text-4xl">Your notifications</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Likes, conversations, and stories shared with you.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh notifications"
              disabled={loading}
              onClick={() => {
                reload()
                refresh()
              }}
            >
              <RefreshCw />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !data?.unreadCount}
              onClick={readAll}
            >
              <CheckCheck />
              Mark all as read
            </Button>
          </div>
        </div>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : data?.notifications.length ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
              {data.unreadCount} unread
            </p>
            <ul className="overflow-hidden rounded-xl border">
              {data.notifications.map((notification) => {
                const item = activity[notification.type]
                const Icon = item.icon
                const path =
                  '/story/' +
                  notification.post.slug +
                  (notification.type === 'comment' || notification.type === 'reply'
                    ? '#comments-' + notification.post.id
                    : '')
                return (
                  <li key={notification.id} className="border-b last:border-b-0">
                    <Link
                      to={path}
                      onClick={() => void read(notification)}
                      className={cn(
                        'flex items-start gap-3 p-4 transition-colors hover:bg-secondary/60 sm:p-5',
                        !notification.readAt && 'bg-secondary/30',
                      )}
                    >
                      <Avatar author={notification.actor} className="mt-1 size-10" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-relaxed">
                          <strong>{notification.actor.name}</strong> {item.text}
                        </p>
                        <p className="mt-1 font-serif text-xl leading-snug [overflow-wrap:anywhere]">
                          {notification.post.title}
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Icon size={13} />
                          <time dateTime={notification.createdAt}>
                            {formatDate(notification.createdAt)}
                          </time>
                          {!notification.readAt && <span className="text-primary">Unread</span>}
                        </p>
                      </div>
                      {!notification.readAt && (
                        <span
                          className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
            {data.pages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {data.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pages || loading}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="You’re all caught up."
            description="When someone likes or comments on your stories, replies to you, or shares a story, you’ll see it here."
          >
            <Bell className="mx-auto size-8 text-primary/60" />
          </EmptyState>
        )}
      </div>
    </div>
  )
}
