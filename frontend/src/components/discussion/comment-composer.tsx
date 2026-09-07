import { useId, useRef, useState, type FormEvent } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type CommentComposerProps = {
  label: string
  submitLabel: string
  placeholder?: string
  initialContent?: string
  autoFocus?: boolean
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
}

export function CommentComposer({
  label,
  submitLabel,
  placeholder = 'What stayed with you? Share a thought or ask a question…',
  initialContent = '',
  autoFocus = false,
  onSubmit,
  onCancel,
}: CommentComposerProps) {
  const id = useId()
  const [content, setContent] = useState(initialContent)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    if (!content.trim()) {
      setError('Write a comment before posting.')
      return
    }
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor={id} className="block text-xs font-medium">
        {label}
      </label>
      <Textarea
        id={id}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required
        maxLength={2000}
        disabled={busy}
        aria-describedby={`${id}-limit`}
        className="min-h-28 bg-background text-sm leading-relaxed"
      />
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span id={`${id}-limit`} className="text-[11px] text-muted-foreground">
          {content.length.toLocaleString()}/2,000 characters
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={busy || !content.trim()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
