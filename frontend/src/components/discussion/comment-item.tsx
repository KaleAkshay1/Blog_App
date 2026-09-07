import { useState } from 'react'
import { CornerDownRight, LoaderCircle, Pencil, Reply, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/story-card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/context/auth'
import { api, type CommentMutation, type StoryComment } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { CommentComposer } from './comment-composer'

type CommentItemProps = {
  postId: string
  comment: StoryComment
  onReply: (comment: StoryComment) => void
  onUpdate: (comment: StoryComment, commentCount: number) => void
}

export function CommentItem({ postId, comment, onReply, onUpdate }: CommentItemProps) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const owned = user?.id === comment.author?.id
  const path = `/posts/${postId}/comments/${comment.id}`

  const edit = async (content: string) => {
    const result = await api<CommentMutation>(path, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    })
    onUpdate(result.comment, result.commentCount)
    setEditing(false)
    toast.success('Your comment was updated.')
  }

  const remove = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      const result = await api<CommentMutation>(path, { method: 'DELETE' })
      onUpdate(result.comment, result.commentCount)
      setDeleteOpen(false)
      toast.success('Your comment was deleted.')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {comment.isDeleted ? (
        <p className="rounded-lg bg-secondary/50 px-4 py-3 text-xs italic text-muted-foreground">
          This comment was deleted.
        </p>
      ) : (
        <div className="flex items-start gap-3">
          {comment.author && <Avatar author={comment.author} className="mt-0.5 size-9" />}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-sm font-semibold">
                {comment.author?.name || 'Former member'}
              </span>
              {owned && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  You
                </span>
              )}
              <time
                dateTime={comment.createdAt}
                title={new Date(comment.createdAt).toLocaleString()}
                className="text-[11px] text-muted-foreground"
              >
                {formatDate(comment.createdAt)}
              </time>
              {comment.editedAt && (
                <span
                  title={`Edited ${new Date(comment.editedAt).toLocaleString()}`}
                  className="text-[10px] text-muted-foreground"
                >
                  (edited)
                </span>
              )}
            </div>
            {comment.replyTo && (
              <p className="mb-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <CornerDownRight size={12} />
                Replying to {comment.replyTo.authorName || 'a deleted comment'}
              </p>
            )}
            {editing ? (
              <CommentComposer
                label="Edit your comment"
                submitLabel="Save changes"
                initialContent={comment.content}
                onSubmit={edit}
                onCancel={() => setEditing(false)}
                autoFocus
              />
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm leading-[1.8] text-foreground/85 [overflow-wrap:anywhere]">
                  {comment.content}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground"
                    onClick={() => onReply(comment)}
                  >
                    <Reply className="!size-3.5" />
                    Reply
                  </Button>
                  {owned && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground"
                        onClick={() => setEditing(true)}
                      >
                        <Pencil className="!size-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="!size-3.5" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your comment?</DialogTitle>
            <DialogDescription>
              Your comment text will be permanently removed. Other people’s replies will stay in the
              conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteOpen(false)}>
              Keep comment
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={remove}>
              {deleting && <LoaderCircle className="animate-spin" />}Delete comment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
