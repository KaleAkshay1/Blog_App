import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, BookOpen, Clock3 } from 'lucide-react'
import { useAuth } from '@/context/auth'
import type { Post, Author } from '@/lib/api'
import { cn, formatDate, initials } from '@/lib/utils'
import { imageSource } from '@/lib/images'
import { Button } from '@/components/ui/button'

export function CoverImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string
  alt: string
  className?: string
  eager?: boolean
}) {
  const [failed, setFailed] = useState(false)
  return src && !failed ? (
    <img
      src={imageSource(src)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className)}
    />
  ) : (
    <div
      className={cn(
        'cover-placeholder flex h-full w-full items-center justify-center bg-secondary text-primary/50',
        className,
      )}
    >
      <BookOpen size={52} strokeWidth={1} />
      <span className="sr-only">{alt}</span>
    </div>
  )
}
export function Avatar({ author, className }: { author: Author; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7eadf] text-[10px] font-semibold text-primary',
        className,
      )}
    >
      {author.avatar && !failed ? (
        <img
          className="h-full w-full object-cover"
          src={imageSource(author.avatar)}
          alt=""
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        initials(author.name)
      )}
    </span>
  )
}
export function SaveButton({ post, className }: { post: Post; className?: string }) {
  const { user, toggleBookmark } = useAuth()
  const saved = user?.bookmarks.includes(post.id) || false
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('text-muted-foreground hover:text-primary', saved && 'text-primary', className)}
      aria-label={saved ? `Unsave ${post.title}` : `Save ${post.title}`}
      aria-pressed={saved}
      onClick={() => void toggleBookmark(post.id)}
    >
      <Bookmark size={18} className={cn(saved && 'fill-primary/20')} />
    </Button>
  )
}
export function StoryCard({ post }: { post: Post }) {
  return (
    <article className="story-card group">
      <Link
        to={`/story/${post.slug}`}
        className="relative mb-5 block aspect-[1.62] overflow-hidden rounded-xl bg-secondary"
        tabIndex={-1}
        aria-hidden="true"
      >
        <CoverImage
          src={post.coverImage}
          alt=""
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="mb-3 flex items-center gap-3">
        <Link
          to={`/?category=${encodeURIComponent(post.category)}`}
          className={`category-label category-${post.category.toLowerCase().replace(' ', '-')}`}
        >
          {post.category}
        </Link>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 size={12} />
          {post.readTime} min read
        </span>
      </div>
      <h3 className="mb-2.5 font-serif text-[26px] font-medium leading-[1.2] tracking-[-0.025em]">
        <Link to={`/story/${post.slug}`} className="transition-colors hover:text-primary">
          {post.title}
        </Link>
      </h3>
      <p className="line-clamp-2 text-sm leading-[1.7] text-muted-foreground">{post.excerpt}</p>
      <div className="mt-auto flex items-center justify-between pt-5">
        <div className="flex items-center gap-2.5">
          <Avatar author={post.author} />
          <div>
            <p className="text-xs font-semibold">{post.author.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {formatDate(post.publishedAt)}
            </p>
          </div>
        </div>
        <SaveButton post={post} />
      </div>
    </article>
  )
}
