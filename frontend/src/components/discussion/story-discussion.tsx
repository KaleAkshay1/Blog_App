import { useEffect, useRef, useState } from 'react'
import { Heart, LoaderCircle, MessageCircle, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/story-card'
import { useAuth } from '@/context/auth'
import { useResource } from '@/hooks/use-resource'
import {
  api,
  type CommentMutation,
  type CommentPage,
  type PostEngagement,
  type StoryComment,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import { CommentComposer } from './comment-composer'
import { CommentThread } from './comment-thread'

function CommentSection({
  postId,
  commentCount,
  onCountChange,
}: {
  postId: string
  commentCount: number | null
  onCountChange: (count: number) => void
}) {
  const { user, openAuth } = useAuth()
  const [page, setPage] = useState(1)
  const [comments, setComments] = useState<StoryComment[]>([])
  const { data, loading, error, reload } = useResource<CommentPage>(
    `/posts/${postId}/comments?page=${page}&limit=10`,
  )

  useEffect(() => {
    if (data) {
      setComments(data.comments)
      if (typeof data.commentCount === 'number') onCountChange(data.commentCount)
    }
  }, [data, onCountChange])

  const createComment = async (content: string) => {
    const result = await api<CommentMutation>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    onCountChange(result.commentCount)
    setPage(1)
    if (page === 1) reload()
    toast.success('Your comment was added.')
  }
  const updateComment = (updated: StoryComment, count: number) => {
    setComments((current) =>
      current.map((comment) => (comment.id === updated.id ? updated : comment)),
    )
    onCountChange(count)
  }
  const updateReplyCount = (id: string, count: number) => {
    setComments((current) =>
      current.map((comment) => (comment.id === id ? { ...comment, replyCount: count } : comment)),
    )
  }

  return (
    <section
      id={`comments-${postId}`}
      className="scroll-mt-8 pt-9"
      aria-labelledby={`comments-heading-${postId}`}
    >
      <div className="mb-6">
        <p className="eyebrow mb-3">GOOD STORIES START CONVERSATIONS</p>
        <div className="flex items-center gap-3">
          <h2 id={`comments-heading-${postId}`} className="font-serif text-3xl tracking-tight">
            Join the conversation.
          </h2>
          {commentCount !== null && (
            <span
              aria-label={`${commentCount} comments and replies`}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary"
            >
              {commentCount}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Share a perspective, ask a question, or leave a little encouragement.
        </p>
      </div>
      {user ? (
        <div className="mb-7 rounded-xl border bg-white/40 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <Avatar author={user} />
            <span className="text-xs text-muted-foreground">
              Commenting as <strong className="font-medium text-foreground">{user.name}</strong>
            </span>
          </div>
          <CommentComposer
            label="Your comment"
            submitLabel="Post comment"
            onSubmit={createComment}
          />
        </div>
      ) : (
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-secondary/40 p-5">
          <div>
            <p className="text-sm font-medium">Your perspective belongs here.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to like stories, leave comments, and reply.
            </p>
          </div>
          <Button size="sm" onClick={() => openAuth('login')}>
            Sign in to join
          </Button>
        </div>
      )}
      {loading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
        >
          <LoaderCircle className="size-4 animate-spin" />
          Loading the conversation…
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border p-5 text-center">
          <p className="mb-3 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : comments.length ? (
        <>
          <div className="mb-1 flex items-center justify-between gap-3 border-b pb-3 text-xs text-muted-foreground">
            <span>Comments & replies</span>
            <span>Newest comments first</span>
          </div>
          <div className="divide-y">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                postId={postId}
                comment={comment}
                onUpdate={updateComment}
                onCountChange={onCountChange}
                onReplyCountChange={updateReplyCount}
              />
            ))}
          </div>
          {data && data.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <span className="text-xs text-muted-foreground">
                Comment threads · page {page} of {data.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="py-10 text-center">
          <MessageSquare className="mx-auto mb-3 size-7 text-primary/50" strokeWidth={1.4} />
          <p className="font-serif text-2xl">Every conversation starts somewhere.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Be the first to share a thought about this story.
          </p>
        </div>
      )}
    </section>
  )
}

export function StoryDiscussion({ postId }: { postId: string }) {
  const { user, loading: authLoading, openAuth } = useAuth()
  const { data, loading, error, reload } = useResource<PostEngagement>(
    `/posts/${postId}/engagement`,
  )
  const [likes, setLikes] = useState<Pick<PostEngagement, 'likeCount' | 'likedByMe'> | null>(null)
  const [commentCount, setCommentCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const liking = useRef(false)

  useEffect(() => {
    if (data) {
      setLikes({ likeCount: data.likeCount, likedByMe: data.likedByMe })
      setCommentCount((current) => current ?? data.commentCount)
    }
  }, [data])

  const toggleLike = async () => {
    if (!user) {
      openAuth('login')
      return
    }
    if (!likes || liking.current) return
    liking.current = true
    setBusy(true)
    try {
      const result = await api<Pick<PostEngagement, 'likeCount' | 'likedByMe'>>(
        `/posts/${postId}/like`,
        { method: 'PUT', body: JSON.stringify({ liked: !likes.likedByMe }) },
      )
      setLikes(result)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      liking.current = false
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-[700px]">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-secondary/30 px-4 py-4 sm:px-5">
        <div>
          <p className="font-serif text-2xl">Did this story speak to you?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A little appreciation goes a long way.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={cn(
              'rounded-full bg-background',
              likes?.likedByMe &&
                'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15',
            )}
            aria-label={likes?.likedByMe ? 'Unlike this story' : 'Like this story'}
            aria-pressed={likes?.likedByMe || false}
            disabled={busy || loading || authLoading || !!error}
            onClick={toggleLike}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Heart className={cn(likes?.likedByMe && 'fill-current')} />
            )}
            <span aria-live="polite">{likes ? likes.likeCount.toLocaleString() : '…'}</span>
            <span className="text-xs">{likes?.likeCount === 1 ? 'like' : 'likes'}</span>
          </Button>
          <a
            href={`#comments-${postId}`}
            className="inline-flex items-center gap-1.5 rounded-md px-1 py-2 text-xs text-muted-foreground hover:text-primary"
            aria-label="Read comments and replies"
          >
            <MessageCircle size={17} />
            <span aria-live="polite">{commentCount ?? '…'}</span>
          </a>
        </div>
        {error && (
          <div
            role="alert"
            className="flex w-full flex-wrap items-center gap-2 text-xs text-red-700"
          >
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={reload}>
              Retry likes
            </Button>
          </div>
        )}
      </div>
      <CommentSection postId={postId} commentCount={commentCount} onCountChange={setCommentCount} />
    </div>
  )
}
