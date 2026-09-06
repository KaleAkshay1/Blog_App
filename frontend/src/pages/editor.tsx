import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowUpRight, ImagePlus, PenLine, Eye, LoaderCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState, ErrorState, Loading } from '@/components/feedback'
import { CoverImage } from '@/components/story-card'
import { useAuth } from '@/context/auth'
import { useResource } from '@/hooks/use-resource'
import { api, categories, type Post, type PostInput } from '@/lib/api'
import { cn } from '@/lib/utils'

const blank: PostInput = {
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Lifestyle',
  status: 'draft',
}
export default function Editor() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useResource<{ post: Post }>(
    slug ? `/posts/${slug}` : null,
  )
  const [form, setForm] = useState<PostInput>(blank)
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState<'draft' | 'published' | null>(null)
  const [saveError, setSaveError] = useState('')
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    document.title = slug ? 'Edit your story — Story' : 'Write a story — Story'
  }, [slug])
  useEffect(() => {
    if (data?.post) {
      const { title, excerpt, content, coverImage, category, status } = data.post
      setForm({ title, excerpt, content, coverImage, category, status })
      setDirty(false)
    } else if (!slug) {
      setForm(blank)
      setDirty(false)
    }
  }, [data, slug])
  useEffect(() => {
    if (!dirty) return
    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])
  const change = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const status =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-status') === 'draft'
        ? 'draft'
        : 'published'
    setBusy(status)
    setSaveError('')
    try {
      const result = await api<{ post: Post }>(
        data?.post && slug ? `/posts/${data.post.id}` : '/posts',
        { method: slug ? 'PUT' : 'POST', body: JSON.stringify({ ...form, status }) },
      )
      setDirty(false)
      toast.success(
        status === 'draft'
          ? 'Draft saved. Come back whenever you’re ready.'
          : 'Your story is out in the world.',
      )
      navigate(status === 'draft' ? '/dashboard' : `/story/${result.post.slug}`)
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }
  if (slug && loading) return <Loading />
  if (slug && error)
    return (
      <div className="page-shell py-16">
        <ErrorState message={error} retry={reload} />
      </div>
    )
  if (slug && data?.post.author.id !== user?.id)
    return (
      <div className="page-shell py-16">
        <EmptyState
          title="This is someone else’s writing desk."
          description="You can edit the stories you’ve written from your own dashboard."
        >
          <Button asChild>
            <Link to="/dashboard">Go to my stories</Link>
          </Button>
        </EmptyState>
      </div>
    )
  const words = form.content.trim() ? form.content.trim().split(/\s+/).length : 0
  return (
    <div className="page-shell pb-20 pt-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
        onClick={(event) => {
          if (dirty && !window.confirm('Leave the editor? Your unsaved changes will be lost.'))
            event.preventDefault()
        }}
      >
        <ArrowLeft size={14} />
        Back to your writing desk
      </Link>
      <form onSubmit={save}>
        <header className="editor-heading">
          <div>
            <p className="eyebrow mb-3">LET’S PUT IT INTO WORDS</p>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
              {slug ? 'Every edit is a new beginning.' : 'The world could use your story.'}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Start with a thought. See where it takes you.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" type="submit" data-status="draft" disabled={!!busy}>
              {busy === 'draft' ? <LoaderCircle className="animate-spin" /> : <Save />}
              {form.status === 'published' ? 'Move to drafts' : 'Save draft'}
            </Button>
            <Button type="submit" data-status="published" disabled={!!busy}>
              {busy === 'published' ? <LoaderCircle className="animate-spin" /> : <ArrowUpRight />}
              {form.status === 'published' ? 'Update story' : 'Publish story'}
            </Button>
          </div>
        </header>
        {saveError && (
          <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
            {saveError}
          </p>
        )}
        <div className="editor-grid">
          <div className="min-w-0 space-y-6">
            <div className="field">
              <label htmlFor="story-title">Story title</label>
              <Input
                id="story-title"
                name="title"
                value={form.title}
                onChange={(event) => change('title', event.target.value)}
                required
                minLength={5}
                maxLength={160}
                placeholder="Give your story a title…"
                className="h-16 font-serif text-[27px]"
              />
            </div>
            <div className="field">
              <div className="flex justify-between">
                <label htmlFor="story-excerpt">A little introduction</label>
                <span className="text-xs text-muted-foreground">{form.excerpt.length}/320</span>
              </div>
              <Textarea
                id="story-excerpt"
                value={form.excerpt}
                onChange={(event) => change('excerpt', event.target.value)}
                required
                minLength={10}
                maxLength={320}
                placeholder="A sentence or two to invite your readers in."
              />
            </div>
            <div className="overflow-hidden rounded-xl border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-secondary/40 px-3 py-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={preview ? 'ghost' : 'secondary'}
                    onClick={() => setPreview(false)}
                  >
                    <PenLine />
                    Write
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={preview ? 'secondary' : 'ghost'}
                    onClick={() => setPreview(true)}
                  >
                    <Eye />
                    Preview
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">Markdown supported</span>
              </div>
              <label htmlFor="story-content" className="sr-only">
                Your story
              </label>
              <Textarea
                id="story-content"
                value={form.content}
                onChange={(event) => change('content', event.target.value)}
                minLength={20}
                maxLength={50000}
                required
                placeholder="It started with a little curiosity…"
                className={cn(
                  'min-h-[430px] resize-y rounded-none border-0 p-5 font-serif text-lg leading-relaxed focus-visible:ring-inset',
                  preview && 'sr-only',
                )}
                onInvalid={() => setPreview(false)}
              />
              {preview && (
                <div className="prose-story min-h-[430px] p-6">
                  {form.content ? (
                    <ReactMarkdown>{form.content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">
                      Your words will appear here as you write.
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-between border-t px-4 py-2.5 text-[11px] text-muted-foreground">
                <span>
                  {words} words · {Math.max(1, Math.ceil(words / 200))} min read
                </span>
                <span>
                  {dirty ? 'Unsaved changes' : slug ? 'All changes saved' : 'A fresh page'}
                </span>
              </div>
            </div>
          </div>
          <aside className="space-y-5">
            <div className="rounded-xl border bg-white/50 p-5">
              <h2 className="mb-5 font-serif text-2xl">The finishing touches</h2>
              <div className="field mb-5">
                <label htmlFor="story-category">Choose a topic</label>
                <select
                  id="story-category"
                  value={form.category}
                  onChange={(event) =>
                    change('category', event.target.value as PostInput['category'])
                  }
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm focus:outline-primary"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="story-cover">
                  Cover image URL{' '}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="story-cover"
                  type="url"
                  value={form.coverImage}
                  onChange={(event) => change('coverImage', event.target.value)}
                  pattern="https://.*"
                  maxLength={2000}
                  placeholder="https://images.example.com/photo.jpg"
                />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Use a public HTTPS image you have permission to share.
                </p>
              </div>
              <div className="mt-4 aspect-[1.6] overflow-hidden rounded-lg bg-secondary">
                {form.coverImage.startsWith('https://') ? (
                  <CoverImage
                    key={form.coverImage}
                    src={form.coverImage}
                    alt="Your cover preview"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-primary/60">
                    <ImagePlus size={25} strokeWidth={1.2} />
                    <span className="text-xs">A window into your story</span>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-secondary/60 p-5">
              <p className="mb-3 text-xs font-semibold text-primary">
                A few words of encouragement
              </p>
              <p className="text-xs leading-[1.9] text-muted-foreground">
                Write like you’re talking to a friend. Be curious. Be specific. And let your own
                voice come through.
              </p>
              <div className="my-4 h-px bg-primary/10" />
              <p className="text-[11px] leading-[1.9] text-muted-foreground">
                <strong>## Heading</strong> for a new section
                <br />
                <strong>**bold**</strong> for emphasis
                <br />
                <strong>&gt; Quote</strong> for words worth pausing on
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
