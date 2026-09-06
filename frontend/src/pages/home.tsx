import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Clock3,
  Leaf,
  Check,
  Mail,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, CoverImage, SaveButton, StoryCard } from '@/components/story-card'
import { EmptyState, ErrorState, Loading } from '@/components/feedback'
import { WriteButton } from '@/components/layout'
import { useResource } from '@/hooks/use-resource'
import { api, categories, type PostList } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'

export function Newsletter() {
  const [busy, setBusy] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const email = new FormData(event.currentTarget).get('email')
    try {
      await api('/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
      setSubscribed(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="newsletter" aria-labelledby="newsletter-title">
      <div className="newsletter-mark">
        <Mail strokeWidth={1.2} size={29} />
      </div>
      <div className="flex-1">
        <p className="eyebrow mb-2">A LITTLE SOMETHING WORTH OPENING</p>
        <h2 id="newsletter-title" className="font-serif text-[32px] leading-tight tracking-tight">
          Good stories. Straight to your inbox.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Join the list for future picks from the Story community.
        </p>
      </div>
      <div className="newsletter-form">
        {subscribed ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-lg bg-primary/10 p-4 text-sm text-primary"
          >
            <Check className="size-5" />
            You’re on the list. Thanks for being here!
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="flex gap-2">
              <Input
                type="email"
                name="email"
                aria-label="Email for newsletter"
                placeholder="Your email address"
                required
                maxLength={254}
                className="bg-background"
              />
              <Button disabled={busy} type="submit" className="h-11">
                {busy ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <>
                    Count me in <ArrowRight />
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2.5 text-[11px] text-muted-foreground">
              A thoughtful read starts with a little curiosity.
            </p>
            {error && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}

export default function Home() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || ''
  const search = params.get('search') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const sort = params.get('sort') === 'oldest' ? 'oldest' : 'latest'
  const query = new URLSearchParams({ page: String(page), limit: '6', sort })
  if (category && categories.includes(category as (typeof categories)[number]))
    query.set('category', category)
  if (search) query.set('search', search)
  if (!category && !search) query.set('featured', 'false')
  const { data, loading, error, reload } = useResource<PostList>(`/posts?${query}`)
  const feature = useResource<PostList>('/posts?featured=true&limit=1')
  const featured = feature.data?.posts[0]
  useEffect(() => {
    document.title = 'Story — A home for curious minds'
  }, [])
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { preventScrollReset: true })
  }
  return (
    <>
      <section className="hero page-shell">
        <div className="hero-eyebrow">
          <span className="h-px w-7 bg-primary/40" />
          <span>A HOME FOR CURIOUS MINDS</span>
          <span className="h-px w-7 bg-primary/40" />
        </div>
        <h1>
          A little curiosity.
          <br />
          <em>A whole new perspective.</em>
        </h1>
        <p>
          Stories that spark ideas, shift perspectives, and make you feel a little
          <br className="hidden sm:block" /> more connected. Written by people, for people.
        </p>
        <div className="hero-footnote">
          <span className="hero-dot" />
          Find your next good read.
          <ArrowRight size={13} />
        </div>
        <span className="hero-spark" aria-hidden="true">
          ✳
        </span>
      </section>
      <div className="page-shell">
        {feature.loading ? (
          <div
            className="mb-14 h-[365px] animate-pulse rounded-2xl bg-secondary"
            aria-label="Loading featured story"
          />
        ) : (
          featured && (
            <section className="featured-story" aria-label="Featured story">
              <Link to={`/story/${featured.slug}`} className="featured-image group">
                <CoverImage
                  src={featured.coverImage}
                  alt="A quiet alpine lake reflecting mountains and a small cabin"
                  eager
                  className="transition-transform duration-700 group-hover:scale-105"
                />
                <span className="featured-badge">
                  <Sparkles size={13} />
                  THE EDITOR’S PICK
                </span>
                <div className="image-caption">
                  <span className="size-1.5 rounded-full bg-white/80" />A MOMENT TO SLOW DOWN
                </div>
              </Link>
              <div className="featured-content">
                <div className="mb-5 flex items-center gap-3">
                  <span className="category-label category-lifestyle">{featured.category}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 size={12} />
                    {featured.readTime} min read
                  </span>
                </div>
                <h2>
                  <Link to={`/story/${featured.slug}`}>{featured.title}</Link>
                </h2>
                <p className="featured-excerpt">{featured.excerpt}</p>
                <div className="mb-6 flex items-center gap-2.5">
                  <Avatar author={featured.author} className="size-9" />
                  <div>
                    <p className="text-xs font-semibold">{featured.author.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(featured.publishedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to={`/story/${featured.slug}`}
                    className="inline-flex items-center gap-2.5 text-[13px] font-semibold text-primary hover:gap-4 transition-all"
                  >
                    Read the story <ArrowRight size={16} />
                  </Link>
                  <SaveButton post={featured} />
                </div>
              </div>
            </section>
          )
        )}
        <section
          id="stories"
          className="stories-section scroll-mt-6"
          aria-labelledby="stories-title"
        >
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-primary">
                <Leaf size={14} />
                <span className="eyebrow">THE LATEST CHAPTERS</span>
              </div>
              <h2 id="stories-title" className="font-serif text-[36px] tracking-[-0.035em]">
                A fresh perspective awaits.
              </h2>
            </div>
            <span className="hidden pb-2 text-xs text-muted-foreground sm:block">
              A little inspiration for your everyday.
            </span>
          </div>
          <div className="category-bar">
            <div className="category-tabs" aria-label="Filter by topic">
              {['All stories', ...categories].map((item, index) => (
                <button
                  key={item}
                  className={cn(
                    'category-tab',
                    (index === 0 ? !category : category === item) && 'selected',
                  )}
                  aria-pressed={index === 0 ? !category : category === item}
                  onClick={() => update('category', index === 0 ? '' : item)}
                >
                  {index === 0 && <Sparkles size={13} />}
                  {item}
                </button>
              ))}
            </div>
            <select
              aria-label="Sort stories"
              className="sort-select"
              value={sort}
              onChange={(event) => update('sort', event.target.value)}
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          {search && (
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Search size={15} />
              <span>
                Results for <strong className="text-foreground">“{search}”</strong>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Clear search"
                onClick={() => update('search', '')}
              >
                <X />
              </Button>
            </div>
          )}
          {loading ? (
            <Loading cards />
          ) : error ? (
            <ErrorState message={error} retry={reload} />
          ) : !data?.posts.length ? (
            <EmptyState
              title="A new story is waiting to be written."
              description={
                search
                  ? 'We couldn’t find a match. Try a different word or browse another topic.'
                  : 'There aren’t any stories here yet. Be the first to share a fresh perspective.'
              }
            >
              <Button variant="outline" onClick={() => setParams({})}>
                Browse all stories
              </Button>
            </EmptyState>
          ) : (
            <>
              <div className="story-grid">
                {data.posts.map((post) => (
                  <StoryCard key={post.id} post={post} />
                ))}
              </div>
              {data.pages > 1 && (
                <div className="pagination">
                  <span className="text-xs text-muted-foreground">
                    Page {data.page} of {data.pages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => {
                        update('page', String(page - 1))
                        document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= data.pages}
                      onClick={() => {
                        update('page', String(page + 1))
                        document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      More stories <ArrowRight />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
        <Newsletter />
        <section className="writer-banner">
          <div>
            <p className="eyebrow mb-3 text-white/60">THERE’S A STORY ONLY YOU CAN TELL</p>
            <h2 className="font-serif text-[38px] leading-tight tracking-tight">
              Make a little room for your voice.
            </h2>
            <p className="mt-3 text-sm text-white/70">
              A thought, a lesson, a different way of seeing. It belongs here.
            </p>
          </div>
          <WriteButton
            label="Write your first story"
            className="h-12 bg-[#f4f5e9] px-5 text-primary hover:bg-white"
          />
          <ArrowUpRight className="writer-banner-arrow" aria-hidden="true" />
        </section>
      </div>
    </>
  )
}
