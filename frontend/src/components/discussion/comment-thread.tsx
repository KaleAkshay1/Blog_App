import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useResource } from '@/hooks/use-resource'
import { useAuth } from '@/context/auth'
import { api, type CommentMutation, type CommentPage, type StoryComment } from '@/lib/api'
import { CommentComposer } from './comment-composer'
import { CommentItem } from './comment-item'

type CommentThreadProps = {
  postId: string
  comment: StoryComment
  onUpdate: (comment: StoryComment, count: number) => void
  onCountChange: (count: number) => void
  onReplyCountChange: (id: string, count: number) => void
}

export function CommentThread({
  postId,
  comment,
  onUpdate,
  onCountChange,
  onReplyCountChange,
}: CommentThreadProps) {
  const { user, openAuth } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [replies, setReplies] = useState<StoryComment[]>([])
  const [replyTarget, setReplyTarget] = useState<StoryComment | null>(null)
  const { data, loading, error, reload } = useResource<CommentPage>(
    expanded ? `/posts/${postId}/comments/${comment.id}/replies?page=${page}&limit=10` : null,
  )
  useEffect(() => {
    if (data) setReplies(data.comments)
  }, [data])

  const beginReply = (target: StoryComment) => {
    if (!user) {
      openAuth('login')
      return
    }
    setReplyTarget(target)
    if (comment.replyCount) setExpanded(true)
  }
  const sendReply = async (content: string) => {
    if (!replyTarget) return
    const result = await api<CommentMutation>(
      `/posts/${postId}/comments/${replyTarget.id}/replies`,
      { method: 'POST', body: JSON.stringify({ content }) },
    )
    onCountChange(result.commentCount)
    onReplyCountChange(comment.id, result.replyCount)
    const lastPage = Math.max(1, Math.ceil(result.replyCount / 10))
    setExpanded(true)
    setPage(lastPage)
    if (expanded && page === lastPage) reload()
    setReplyTarget(null)
    toast.success('Your reply was added.')
  }
  const updateReply = (updated: StoryComment, count: number) => {
    setReplies((current) => current.map((reply) => (reply.id === updated.id ? updated : reply)))
    onCountChange(count)
  }

  return (
    <article
      className="py-7"
      aria-label={`Comment thread by ${comment.author?.name || 'a former member'}`}
    >
      <CommentItem postId={postId} comment={comment} onReply={beginReply} onUpdate={onUpdate} />
      {comment.replyCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-9 mt-2 max-w-[calc(100%-2.25rem)] px-2 text-xs text-primary sm:ml-12"
          aria-expanded={expanded}
          aria-controls={`replies-${comment.id}`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp /> : <ChevronDown />}
          {expanded ? 'Hide' : 'View'} {comment.replyCount}{' '}
          {comment.replyCount === 1 ? 'reply' : 'replies'}
        </Button>
      )}
      {expanded && (
        <div
          id={`replies-${comment.id}`}
          className="ml-4 mt-4 space-y-6 border-l-2 border-primary/10 pl-4 sm:ml-12 sm:pl-5"
        >
          {loading ? (
            <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="size-3.5 animate-spin" />
              Loading replies…
            </p>
          ) : error ? (
            <div role="alert" className="space-y-2">
              <p className="text-xs text-red-700">{error}</p>
              <Button variant="outline" size="sm" onClick={reload}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  postId={postId}
                  comment={reply}
                  onReply={beginReply}
                  onUpdate={updateReply}
                />
              ))}
              {data && data.pages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Replies · page {page} of {data.pages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
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
          )}
        </div>
      )}
      {replyTarget && (
        <div className="ml-4 mt-5 rounded-xl border bg-secondary/30 p-4 sm:ml-12">
          <CommentComposer
            key={replyTarget.id}
            label={`Replying to ${replyTarget.author?.name || 'this comment'}`}
            submitLabel="Post reply"
            placeholder="Keep the conversation going…"
            onSubmit={sendReply}
            onCancel={() => setReplyTarget(null)}
            autoFocus
          />
        </div>
      )}
    </article>
  )
}
