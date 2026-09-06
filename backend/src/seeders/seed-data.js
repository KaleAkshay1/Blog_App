import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { User } from '../models/user.model.js'
import { Post } from '../models/post.model.js'

const photo = (id, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const authors = [
  {
    name: 'Olivia Bennett',
    email: 'olivia@editorial.story.example',
    avatar: photo('photo-1534528741775-53994a69daeb', 100),
  },
  {
    name: 'Alex Morgan',
    email: 'alex@editorial.story.example',
    avatar: photo('photo-1500648767791-00dcc994a43e', 100),
  },
  {
    name: 'Sophie Chen',
    email: 'sophie@editorial.story.example',
    avatar: photo('photo-1524504388940-b1c1722653e1', 100),
  },
  {
    name: 'James Wilson',
    email: 'james@editorial.story.example',
    avatar: photo('photo-1506794778202-cad84cf45f1d', 100),
  },
]
const stories = [
  {
    title: 'The art of slowing down in a world that never stops',
    category: 'Lifestyle',
    excerpt:
      'Maybe the most meaningful thing we can do is a little less. Finding beauty, presence, and a sense of belonging in the everyday.',
    image: 'photo-1470770841072-f978cf4d019e',
    author: 0,
    featured: true,
    sections: [
      [
        'The quiet we keep missing',
        'On a Tuesday morning, I left my phone at home and walked to the end of my street. Nothing remarkable happened. The bakery was opening, a dog was investigating a hedge, and the light came through the trees in a way I had somehow stopped noticing.\n\nFor the first time in weeks, I wasn’t trying to make the moment useful. I was simply in it.',
      ],
      [
        'Make room for ordinary things',
        'We tend to imagine a slower life as something waiting on the other side of a move, a holiday, or a different job. But a slower life can begin with how we drink our morning coffee. With a conversation we don’t rush to finish. With a walk that has no destination.\n\nThe point isn’t to make every moment beautiful. It’s to give ourselves enough room to notice when it already is.',
      ],
      [
        'A small practice for tomorrow',
        'Choose one ordinary activity and give it your complete attention. Leave your phone in another room. Let the task take as long as it takes.\n\nYou might find it uncomfortable. That’s okay. Attention is a practice, and we’re all beginners again sometimes.\n\n> A good life is not only made of the things we accomplish. It is made of the things we notice.',
      ],
    ],
  },
  {
    title: 'Less, but better: a thoughtful approach to everyday design',
    category: 'Design',
    excerpt:
      'What the objects we surround ourselves with can teach us about living with intention.',
    image: 'photo-1494438639946-1ebd1d20bf85',
    author: 2,
    sections: [
      [
        'The objects we choose',
        'A well-made chair, a favourite ceramic cup, a lamp that casts just the right light. The things we use every day quietly shape our experience of home.\n\nThoughtful design begins with paying attention to those small interactions. It asks how an object feels to use, how gracefully it ages, and whether it earns its place in our lives.',
      ],
      [
        'Start with what you already have',
        'Before looking for something new, look at what is already working. Often, a small rearrangement or a simple repair brings more satisfaction than another purchase.\n\nDesign is not a shopping list. It is a way of caring for the spaces and routines we inhabit.',
      ],
      [
        'A useful question',
        'The next time you add something to your home, ask: will this make an ordinary day a little better? If the answer is yes, you have found a good place to start.',
      ],
    ],
  },
  {
    title: 'Finding a little magic in the places between',
    category: 'Travel',
    excerpt:
      'Take the longer route. Some of the best discoveries never make it onto the itinerary.',
    image: 'photo-1464822759023-fed622ff2c3b',
    author: 1,
    sections: [
      [
        'Beyond the destination',
        'We planned the trip around a mountain. What I remember most is the tiny café we found when we missed a turn. The owner drew a new route on a paper napkin and insisted we stop by the lake.\n\nTravel has a way of reminding us that a plan can be useful without being complete.',
      ],
      [
        'Leave a day unplanned',
        'An empty afternoon is an invitation. Walk into the neighbourhood without a list. Browse the bookshop. Take the bus to its last stop. Let curiosity make a few decisions for you.\n\nNot every detour will be extraordinary. But some will become the part of the trip you tell people about for years.',
      ],
      [
        'Bring the habit home',
        'You don’t need a boarding pass to be curious. Choose a different route through your own town this weekend. Notice a building you usually pass. Ask a neighbour about their favourite place.\n\nThe unfamiliar is often closer than we think.',
      ],
    ],
  },
  {
    title: 'A more human way to think about technology',
    category: 'Technology',
    excerpt: 'Building a digital life that makes space for the things that matter most.',
    image: 'photo-1496181133206-80ce9b88a853',
    author: 3,
    sections: [
      [
        'Tools, with intention',
        'The most useful question about a new tool is not what it can do. It is what we want to do with it.\n\nWhen we begin there, our relationship with technology becomes a little more deliberate. We can choose tools that support our attention instead of simply filling it.',
      ],
      [
        'A gentler digital routine',
        'Turn off the notifications that never lead to something important. Put the apps you want to use on your home screen, and move the rest out of the way. Give your day a small stretch of time that belongs entirely to the offline world.\n\nThese changes are small enough to try without redesigning your life.',
      ],
      [
        'Build for people',
        'For those of us who make digital things, there is a responsibility here too. A clear label, an accessible button, a thoughtful default: these are not finishing touches. They are the product.\n\nGood technology should help people do what they came to do, and let them return to the rest of their lives.',
      ],
    ],
  },
  {
    title: 'The quiet joy of making something with your hands',
    category: 'Culture',
    excerpt:
      'An afternoon at the pottery wheel, and a reminder that not everything needs to be perfect.',
    image: 'photo-1493106641515-6b5631de4bb9',
    author: 0,
    sections: [
      [
        'Learning to begin again',
        'My first bowl was not a bowl. It was a soft, lopsided suggestion of one. The teacher smiled and handed me another piece of clay.\n\nThere is a particular relief in being a beginner at something tangible. The material gives you immediate feedback, and there is very little room to pretend.',
      ],
      [
        'The value of a small practice',
        'Working with our hands brings us back to a different kind of attention. We notice weight, texture, pressure, temperature. Our ideas become things we can hold.\n\nYou don’t need a studio to begin. Mend a shirt. Fold a small book. Cook something that asks for a little patience.',
      ],
      [
        'Make it anyway',
        'The object does not need to be perfect to carry meaning. Sometimes its uneven edges are precisely what make it yours.',
      ],
    ],
  },
  {
    title: 'You don’t have to have it all figured out',
    category: 'Personal Growth',
    excerpt:
      'On starting before you feel ready, and letting your own path unfold one step at a time.',
    image: 'photo-1441974231531-c6227db76b6e',
    author: 2,
    sections: [
      [
        'Permission to be in progress',
        'We often see other people at their most certain and ourselves at our most unfinished. It makes an ordinary amount of uncertainty feel like a personal failure.\n\nBut a life in progress is exactly what a life is. We are allowed to change our minds as we learn.',
      ],
      [
        'Take the next honest step',
        'Instead of trying to plan the next decade, consider the next action that feels worthwhile. Send the email. Try the class. Have the conversation.\n\nSmall experiments give us information that thinking alone cannot.',
      ],
      [
        'A little patience',
        'There will be seasons when progress looks quiet. Rest can be part of it. So can paying attention to what you no longer want.\n\nYou are not late to your own life. Keep going at a pace that lets you recognise it.',
      ],
    ],
  },
  {
    title: 'A Sunday morning, a good coffee, and nowhere to be',
    category: 'Lifestyle',
    excerpt:
      'A love letter to unhurried mornings and the small rituals that make a day feel like your own.',
    image: 'photo-1442512595331-e89e73853f31',
    author: 1,
    sections: [
      [
        'The shape of a morning',
        'Sunday begins with the sound of the kettle. I open the window before I open my inbox. There is no grand reason for this, except that the air feels good and I want to remember that the world is larger than my screen.',
      ],
      [
        'Ritual, without rules',
        'A ritual is a small thing we repeat because it gives the day a little shape. It can be a walk, a song, a few pages of a book. It doesn’t need an audience or a perfect setting.\n\nThe best rituals are the ones we can keep on an ordinary day.',
      ],
      [
        'Leave some space',
        'A free morning does not need to become a project. Sometimes the most generous thing we can offer ourselves is a little time with nothing expected of it.',
      ],
    ],
  },
  {
    title: 'Why the best ideas start in a notebook',
    category: 'Design',
    excerpt: 'Rediscovering the freedom of a blank page in a world of infinite tabs.',
    image: 'photo-1455390582262-044cdead277a',
    author: 3,
    sections: [
      [
        'A place to think out loud',
        'A notebook does not send notifications. It does not ask whether your idea is ready to share. It offers a blank page and waits.\n\nThat quiet makes it a useful companion for the earliest stages of an idea, when the important thing is to keep moving without judging every line.',
      ],
      [
        'Collect before you connect',
        'Write down the sentence that stays with you. Sketch the shape you notice on your commute. Make a list of questions you don’t yet know how to answer.\n\nOver time, these fragments begin to speak to one another.',
      ],
      [
        'Keep it imperfect',
        'Use the pen you have. Cross things out. Leave a page half finished. A notebook becomes more valuable when you let it be a working space instead of a performance.',
      ],
    ],
  },
  {
    title: 'The bookshop at the end of the street',
    category: 'Culture',
    excerpt:
      'Inside the little spaces that bring a neighbourhood together, one conversation at a time.',
    image: 'photo-1507842217343-583bb7270b66',
    author: 0,
    sections: [
      [
        'More than shelves',
        'The bookshop is small enough that you have to step aside when someone walks down the same aisle. On Saturdays, there is a pot of tea on the counter and a handwritten note beside a stack of new arrivals.\n\nI came in looking for a novel. I stayed because the conversation was good.',
      ],
      [
        'Places that remember us',
        'Every neighbourhood needs places where people can be present without hurrying. A library, a park bench, a café with patient tables.\n\nThese spaces help turn a collection of addresses into a community.',
      ],
      [
        'Show up',
        'Buy a book when you can. Borrow one when you can’t. Ask someone what they are reading. The life of a local place is made of small, repeated acts of attention.',
      ],
    ],
  },
]

export async function seedDatabase() {
  if ((await Post.countDocuments()) > 0) return 0
  const users = []
  const password = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
  for (const author of authors)
    users.push(
      await User.findOneAndUpdate(
        { email: author.email },
        { $setOnInsert: { ...author, password } },
        { upsert: true, returnDocument: 'after' },
      ),
    )
  const now = new Date()
  const posts = stories.map((story, i) => {
    const content = `${story.excerpt}\n\n${story.sections.map(([heading, body]) => `## ${heading}\n\n${body}`).join('\n\n')}`
    return {
      title: story.title,
      slug: story.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-$/g, ''),
      excerpt: story.excerpt,
      content,
      category: story.category,
      coverImage: photo(story.image),
      author: users[story.author]._id,
      status: 'published',
      featured: !!story.featured,
      readTime: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
      publishedAt: new Date(now.getTime() - (i + 1) * 86400000),
    }
  })
  await Post.insertMany(posts)
  return posts.length
}
