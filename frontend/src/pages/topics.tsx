import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Coffee, Palette, Cpu, Compass, BookOpen, Sprout } from 'lucide-react'
import { useResource } from '@/hooks/use-resource'
import { Loading, ErrorState } from '@/components/feedback'
import { Newsletter } from '@/pages/home'

const descriptions: Record<string, { description: string; icon: typeof Coffee; color: string }> = {
  Lifestyle: {
    description: 'Finding a little more meaning in the everyday.',
    icon: Coffee,
    color: '#e9efe2',
  },
  Design: {
    description: 'Thoughtful spaces, useful things, and fresh ideas.',
    icon: Palette,
    color: '#f0e9df',
  },
  Technology: {
    description: 'A human perspective on our changing digital world.',
    icon: Cpu,
    color: '#e7edf1',
  },
  Travel: {
    description: 'New places, open roads, and a curious state of mind.',
    icon: Compass,
    color: '#e6ede7',
  },
  Culture: {
    description: 'The books, art, and communities that connect us.',
    icon: BookOpen,
    color: '#eee5e5',
  },
  'Personal Growth': {
    description: 'Small steps toward a life that feels like your own.',
    icon: Sprout,
    color: '#efedde',
  },
}
export default function Topics() {
  const { data, loading, error, reload } = useResource<{
    topics: { name: string; count: number }[]
  }>('/topics')
  useEffect(() => {
    document.title = 'Explore topics — Story'
  }, [])
  return (
    <div className="page-shell">
      <header className="page-heading text-center">
        <p className="eyebrow mb-4">FOLLOW YOUR CURIOSITY</p>
        <h1>There’s a world to explore.</h1>
        <p>Find something you love. Or discover something you didn’t know you would.</p>
      </header>
      {loading ? (
        <Loading cards />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.topics.map((topic) => {
            const { icon: Icon, description, color } = descriptions[topic.name]
            return (
              <Link
                key={topic.name}
                to={`/?category=${encodeURIComponent(topic.name)}`}
                className="topic-card group"
              >
                <div className="mb-8 flex items-start justify-between">
                  <span
                    style={{ background: color }}
                    className="flex size-12 items-center justify-center rounded-xl text-primary"
                  >
                    <Icon strokeWidth={1.3} />
                  </span>
                  <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
                <h2 className="mb-2 font-serif text-3xl">{topic.name}</h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <p className="text-xs font-medium text-primary">
                  {topic.count} {topic.count === 1 ? 'story' : 'stories'} to discover
                </p>
              </Link>
            )
          })}
        </div>
      )}
      <Newsletter />
    </div>
  )
}
