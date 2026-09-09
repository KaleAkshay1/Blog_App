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

export type ApiResponse<T> = {
  status: number
  data: T
  message: string
  success: true
}

export class ApiError extends Error {
  readonly status: number
  readonly success = false
  readonly error: unknown[]

  constructor(status: number, message: string, error: unknown[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.error = error
  }
}

// Use the full response when a caller needs the server's success message.
export async function apiResponse<T = null>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
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
  const body: unknown = await response.json().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return null
  })
  const result = body && typeof body === 'object' ? body : null
  const message =
    result && 'message' in result && typeof result.message === 'string' ? result.message : ''

  if (!response.ok) {
    const details = result && 'error' in result && Array.isArray(result.error) ? result.error : []
    throw new ApiError(
      response.status,
      message || 'The server is unavailable. Please try again shortly.',
      details,
    )
  }

  if (
    !result ||
    !('success' in result) ||
    result.success !== true ||
    !('status' in result) ||
    result.status !== response.status ||
    !('data' in result) ||
    !message
  ) {
    throw new ApiError(
      response.status,
      'The server returned an invalid response. Please try again.',
    )
  }
  return result as ApiResponse<T>
}

// Most screens only need the payload inside the standard response.
export async function api<T = null>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiResponse<T>(path, options)
  return response.data
}
