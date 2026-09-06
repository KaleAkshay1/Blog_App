import { BookOpen, LoaderCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export function Loading({ cards = false }: { cards?: boolean }) {
  if (cards)
    return (
      <div
        className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-label="Loading stories"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="mb-5 aspect-[1.62] rounded-xl bg-secondary" />
            <div className="mb-3 h-4 w-1/3 rounded bg-secondary" />
            <div className="mb-2 h-7 w-full rounded bg-secondary" />
            <div className="h-7 w-3/4 rounded bg-secondary" />
          </div>
        ))}
      </div>
    )
  return (
    <div
      className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground"
      role="status"
    >
      <LoaderCircle className="size-5 animate-spin" />
      Turning the page…
    </div>
  )
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed px-5 py-16 text-center">
      <BookOpen className="mx-auto mb-4 size-9 text-primary/60" strokeWidth={1.25} />
      <h2 className="mb-2 font-serif text-3xl">{title}</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  )
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div role="alert">
      <EmptyState title="A little interruption." description={message}>
        {retry && (
          <Button variant="outline" onClick={retry}>
            <RefreshCw />
            Try again
          </Button>
        )}
      </EmptyState>
    </div>
  )
}
