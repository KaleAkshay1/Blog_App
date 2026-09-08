export type Category =
  | 'Lifestyle'
  | 'Design'
  | 'Technology'
  | 'Travel'
  | 'Culture'
  | 'Personal Growth'
export const categories: Category[] = [
  'Lifestyle',
  'Design',
  'Technology',
  'Travel',
  'Culture',
  'Personal Growth',
]
export type Author = { id: string; name: string; avatar: string }
export type User = Author & { email: string; bookmarks: string[] }
export type FollowSummary = {
  followerCount: number
  followingCount: number
  followedByMe: boolean
}
export type Post = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  category: Category
  author: Author
  status: 'draft' | 'published'
  featured: boolean
  readTime: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
export type PostList = { posts: Post[]; total: number; page: number; pages: number }
export type PostEngagement = { likeCount: number; likedByMe: boolean; commentCount: number }
export type StoryNotification = {
  id: string
  type: 'like' | 'comment' | 'reply' | 'share'
  actor: Author
  post: Pick<Post, 'id' | 'slug' | 'title'>
  readAt: string | null
  createdAt: string
}
export type NotificationPage = {
  notifications: StoryNotification[]
  unreadCount: number
  total: number
  page: number
  pages: number
}
export type StoryComment = {
  id: string
  parentId: string | null
  content: string
  author: Author | null
  replyTo: { id: string; authorName: string | null } | null
  isDeleted: boolean
  editedAt: string | null
  createdAt: string
  replyCount: number
}
export type CommentPage = {
  comments: StoryComment[]
  total: number
  commentCount?: number
  page: number
  pages: number
}
export type CommentMutation = { comment: StoryComment; commentCount: number; replyCount: number }
export type PostInput = Pick<
  Post,
  'title' | 'excerpt' | 'content' | 'coverImage' | 'category' | 'status'
>

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('Unable to connect. Please check your connection and try again.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(data?.message || 'The server is unavailable. Please try again shortly.')
  return data as T
}
