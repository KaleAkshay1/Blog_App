import { useEffect } from 'react'
import { BookOpen, Heart, Sprout } from 'lucide-react'
import { WriteButton } from '@/components/layout'
import { CoverImage } from '@/components/story-card'

export default function About() {
  useEffect(() => {
    document.title = 'Our story — Story'
  }, [])
  return (
    <div className="page-shell pb-20">
      <header className="page-heading text-center">
        <p className="eyebrow mb-4">A LITTLE LESS NOISE. A LITTLE MORE MEANING.</p>
        <h1>Good stories bring us closer.</h1>
        <p>We’re making a little corner of the internet feel more human.</p>
      </header>
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <div className="aspect-[1.1] overflow-hidden rounded-2xl">
          <CoverImage
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=85"
            alt="Sunlight falling through a quiet green forest"
            eager
          />
        </div>
        <div>
          <h2 className="mb-5 font-serif text-4xl leading-tight">
            A home for your thoughts.
            <br />
            <em className="text-primary">And a few new ones.</em>
          </h2>
          <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
            Story began with a simple idea: there should be a place to pause, read something
            thoughtful, and leave with a little more than you came with.
          </p>
          <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
            This is a space for personal essays, fresh ideas, and the observations that make
            ordinary life interesting. You don’t need a big following or all the answers. Just
            something you’d like to share.
          </p>
          <WriteButton label="Share your perspective" />
        </div>
      </div>
      <div className="mx-auto mt-20 grid max-w-5xl gap-8 border-t pt-12 sm:grid-cols-3">
        {[
          {
            icon: BookOpen,
            title: 'Words with room to breathe',
            text: 'Thoughtful stories, a comfortable reading experience, and space to follow your curiosity.',
          },
          {
            icon: Heart,
            title: 'People at the heart of it',
            text: 'Every story has a person behind it. Bring your experience, your questions, and your own voice.',
          },
          {
            icon: Sprout,
            title: 'A place to grow',
            text: 'Start a draft. Try a new idea. Your writing doesn’t have to be perfect to mean something.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon className="mb-4 text-primary" strokeWidth={1.4} />
            <h3 className="mb-3 font-serif text-2xl">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
