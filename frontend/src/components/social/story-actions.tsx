import { useState, type FormEvent } from 'react'
import { Flag, Link as LinkIcon, LoaderCircle, Send, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiResponse, type Post } from '@/lib/api'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function StoryActions({ post }: { post: Post }) {
  const { user, openAuth } = useAuth()
  const [sharing, setSharing] = useState(false)
  const [reporting, setReporting] = useState(false)
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setSharing(true)}>
          <Share2 />
          Share this story
        </Button>
        <Button variant="ghost" onClick={() => (user ? setReporting(true) : openAuth('login'))}>
          <Flag />
          Report story
        </Button>
      </div>
      <ShareDialog post={post} open={sharing} onOpenChange={setSharing} />
      <ReportDialog post={post} open={reporting} onOpenChange={setReporting} />
    </>
  )
}

function ShareDialog({
  post,
  open,
  onOpenChange,
}: {
  post: Post
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user, openAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const url = window.location.origin + '/story/' + post.slug
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Story link copied.')
    } catch {
      setError('Could not copy automatically. Select and copy the link below.')
    }
  }
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await apiResponse('/posts/' + post.id + '/share', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      toast.success(result.message)
      setEmail('')
      onOpenChange(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) {
          setError('')
          onOpenChange(value)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share a little inspiration.</DialogTitle>
          <DialogDescription>
            Send this story to someone on Story, or copy the link to share anywhere.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 border-b pb-5">
          <label htmlFor="story-share-link" className="text-xs font-medium">
            Story link
          </label>
          <div className="flex gap-2">
            <Input
              id="story-share-link"
              value={url}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button variant="outline" onClick={copy} aria-label="Copy share link">
              <LinkIcon />
            </Button>
          </div>
        </div>
        {user ? (
          <form onSubmit={send} className="space-y-3">
            <label htmlFor="share-recipient" className="block text-xs font-medium">
              Recipient email
            </label>
            <Input
              id="share-recipient"
              type="email"
              required
              maxLength={254}
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="reader@example.com"
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              They need a Story account. The story will appear in their in-app notifications.
            </p>
            <Button type="submit" disabled={busy || !email.trim()} className="w-full">
              {busy ? <LoaderCircle className="animate-spin" /> : <Send />}Send story
            </Button>
          </form>
        ) : (
          <Button
            onClick={() => {
              onOpenChange(false)
              openAuth('login')
            }}
          >
            Sign in to send to a member
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReportDialog({
  post,
  open,
  onOpenChange,
}: {
  post: Post
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await apiResponse('/posts/' + post.id + '/reports', {
        method: 'POST',
        body: JSON.stringify({ reason, details }),
      })
      toast.success(result.message)
      setDetails('')
      onOpenChange(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) {
          setError('')
          onOpenChange(value)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this story</DialogTitle>
          <DialogDescription>
            Tell us what concerns you. Your report is private and will be recorded for review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="report-reason" className="block text-xs font-medium">
              Reason
            </label>
            <select
              id="report-reason"
              value={reason}
              disabled={busy}
              onChange={(event) => setReason(event.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="spam">Spam</option>
              <option value="harassment">Harassment or hateful content</option>
              <option value="misinformation">Misleading information</option>
              <option value="copyright">Copyright concern</option>
              <option value="other">Something else</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="report-details" className="block text-xs font-medium">
              Details (optional)
            </label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={2000}
              disabled={busy}
              placeholder="Add context that would help with a review…"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy && <LoaderCircle className="animate-spin" />}Submit report
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
