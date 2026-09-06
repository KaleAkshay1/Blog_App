import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { FileText, PenLine, Eye, Trash2, Bookmark, ArrowRight, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth'
import { useResource } from '@/hooks/use-resource'
import { api, type Post } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CoverImage, StoryCard } from '@/components/story-card'
import { EmptyState, ErrorState, Loading } from '@/components/feedback'
import { WriteButton } from '@/components/layout'

export function RequireAuth() {
  const { user, loading, openAuth } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user)
    return (
      <div className="page-shell py-20">
        <EmptyState
          title="Make yourself at home."
          description="Sign in to write your own stories and keep your favourite reads in one place."
        >
          <Button onClick={() => openAuth('login', location.pathname)}>
            Sign in to continue <ArrowRight />
          </Button>
        </EmptyState>
      </div>
    )
  return <Outlet />
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useResource<{ posts: Post[] }>('/me/posts')
  const [tab, setTab] = useState('all')
  const [deleting, setDeleting] = useState<Post | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    document.title = 'Your writing desk — Story'
  }, [])
  const posts = data?.posts || []
  const visible = posts.filter((post) => tab === 'all' || post.status === tab)
  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await api(`/posts/${deleting.id}`, { method: 'DELETE' })
      toast.success('Story deleted.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-shell pb-20">
      <header className="page-heading flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4">YOUR LITTLE CORNER OF STORY</p>
          <h1>The writing desk.</h1>
          <p>Welcome back, {user?.name.split(' ')[0]}. What’s on your mind?</p>
        </div>
        <WriteButton label="Write a story" />
      </header>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Your stories', count: posts.length, icon: FileText },
          {
            title: 'Published',
            count: posts.filter((post) => post.status === 'published').length,
            icon: Eye,
          },
          {
            title: 'Drafts in progress',
            count: posts.filter((post) => post.status === 'draft').length,
            icon: PenLine,
          },
        ].map(({ title, count, icon: Icon }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-xl border bg-white/50 px-6 py-5"
          >
            <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon size={20} strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-serif text-3xl">{loading ? '—' : count}</p>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex gap-2">
          {[
            { label: 'All stories', value: 'all' },
            { label: 'Published', value: 'published' },
            { label: 'Drafts', value: 'draft' },
          ].map((item) => (
            <button
              key={item.value}
              className={cn('category-tab', tab === item.value && 'selected')}
              aria-pressed={tab === item.value}
              onClick={() => setTab(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Link to="/saved" className="flex items-center gap-2 text-xs text-primary">
          <Bookmark size={14} />
          Your reading list
        </Link>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : !visible.length ? (
        <EmptyState
          title={
            tab === 'draft' ? 'A blank page is a beginning.' : 'Your next chapter starts here.'
          }
          description="An observation, an experience, an idea you can’t stop thinking about. There’s a story in there."
        >
          <WriteButton label="Write a story" />
        </EmptyState>
      ) : (
        <div className="divide-y rounded-xl border bg-white/30 px-5">
          {visible.map((post) => (
            <article key={post.id} className="flex items-center gap-4 py-5 sm:gap-6">
              <Link
                to={`/story/${post.slug}`}
                className="hidden aspect-[1.3] w-28 shrink-0 overflow-hidden rounded-lg sm:block"
                aria-label={`Read ${post.title}`}
              >
                <CoverImage src={post.coverImage} alt="" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      post.status === 'draft'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    {post.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.category}</span>
                </div>
                <h2 className="font-serif text-xl leading-tight sm:text-2xl">
                  <Link to={`/story/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {formatDate(post.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/write/${post.slug}`} aria-label={`Edit ${post.title}`}>
                    <PenLine />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-red-50 hover:text-red-700"
                  aria-label={`Delete ${post.title}`}
                  onClick={() => setDeleting(post)}
                >
                  <Trash2 />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Let this story go?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be permanently deleted. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex justify-end gap-3">
            <Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>
              Keep story
            </Button>
            <Button variant="destructive" disabled={busy} onClick={remove}>
              {busy && <LoaderCircle className="animate-spin" />}Delete story
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function Saved() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useResource<{ posts: Post[] }>('/bookmarks')
  useEffect(() => {
    document.title = 'Your reading list — Story'
  }, [])
  const posts = data?.posts.filter((post) => user?.bookmarks.includes(post.id)) || []
  return (
    <div className="page-shell pb-20">
      <header className="page-heading">
        <p className="eyebrow mb-4">KEEP THE GOOD ONES CLOSE</p>
        <h1>Your reading list.</h1>
        <p>A few stories to come back to. Whenever you find a quiet moment.</p>
      </header>
      {loading ? (
        <Loading cards />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : !posts.length ? (
        <EmptyState
          title="A little space for your next good read."
          description="Tap the bookmark on any story to save it here. Your favourites will be waiting when you are."
        >
          <Button asChild>
            <Link to="/">
              Discover stories <ArrowRight />
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="story-grid">
          {posts.map((post) => (
            <StoryCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
