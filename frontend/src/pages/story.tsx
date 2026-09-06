import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, Clock3, Link as LinkIcon, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { useResource } from '@/hooks/use-resource'
import { type Post, type PostList } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Avatar, CoverImage, SaveButton, StoryCard } from '@/components/story-card'
import { ErrorState, Loading } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'

export default function Story() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { data, loading, error, reload } = useResource<{ post: Post }>(`/posts/${slug}`)
  const post = data?.post
  const related = useResource<PostList>(
    post ? `/posts?category=${encodeURIComponent(post.category)}&limit=4` : null,
  )
  useEffect(() => {
    if (post) document.title = `${post.title} — Story`
  }, [post])
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Story link copied.')
    } catch {
      toast.error('Could not copy the link. You can copy it from your address bar.')
    }
  }
  if (loading)
    return (
      <div className="page-shell">
        <Loading />
      </div>
    )
  if (error || !post)
    return (
      <div className="page-shell py-16">
        <ErrorState message={error || 'This story could not be found.'} retry={reload} />
      </div>
    )
  const more = related.data?.posts.filter((item) => item.id !== post.id).slice(0, 3) || []
  return (
    <article className="page-shell pb-20 pt-9">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={14} />
        Back to discover
      </Link>
      <header className="article-header">
        <div className="mb-5 flex items-center justify-center gap-3">
          <Link to={`/?category=${encodeURIComponent(post.category)}`} className="category-label">
            {post.category}
          </Link>
          {post.status === 'draft' && (
            <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">
              Private draft
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 size={13} />
            {post.readTime} min read
          </span>
        </div>
        <h1>{post.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2.5 text-left">
            <Avatar author={post.author} className="size-10" />
            <div>
              <p className="text-sm font-medium">{post.author.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>
            </div>
          </div>
          <span className="mx-1 h-7 w-px bg-border" />
          {post.status === 'published' && <SaveButton post={post} />}
          <Button variant="ghost" size="icon" aria-label="Copy story link" onClick={share}>
            <LinkIcon />
          </Button>
          {user?.id === post.author.id && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/write/${post.slug}`}>
                <PenLine />
                Edit story
              </Link>
            </Button>
          )}
        </div>
      </header>
      <div className="article-cover">
        <CoverImage src={post.coverImage} alt={post.title} eager />
      </div>
      <div className="prose-story mx-auto max-w-[700px] py-10 sm:py-14">
        <ReactMarkdown>{post.content}</ReactMarkdown>
        <div className="mt-12 text-center text-primary/60">✳ &nbsp; ✳ &nbsp; ✳</div>
      </div>
      <div className="mx-auto flex max-w-[700px] flex-wrap items-center justify-between gap-4 border-y py-6">
        <div className="flex items-center gap-3">
          <Avatar author={post.author} className="size-12" />
          <div>
            <p className="text-xs text-muted-foreground">Words by</p>
            <p className="font-serif text-2xl">{post.author.name}</p>
          </div>
        </div>
        {post.status === 'published' && (
          <Button variant="outline" onClick={() => void share()}>
            <LinkIcon />
            Share this story
          </Button>
        )}
      </div>
      {more.length > 0 && (
        <section className="mt-20">
          <div className="mb-7 flex items-center justify-between">
            <h2 className="font-serif text-3xl">Keep your curiosity going.</h2>
            <Link
              className="text-xs text-primary"
              to={`/?category=${encodeURIComponent(post.category)}`}
            >
              More in {post.category} →
            </Link>
          </div>
          <div className="story-grid">
            {more.map((item) => (
              <StoryCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
