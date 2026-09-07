import { Post } from '../models/post.model.js'
import { Comment } from '../models/comment.model.js'
import { AppError } from './app-error.js'

export async function requirePublishedPost(postId) {
  const post = await Post.findOne({ _id: postId, status: 'published' })
    .select('author title slug')
    .lean()
  if (!post) {
    throw new AppError(404, 'This published story could not be found.')
  }
  return post
}

export const countComments = (postId) => Comment.countDocuments({ post: postId, isDeleted: false })

export const commentPopulation = [
  { path: 'author', select: 'name avatar' },
  { path: 'replyTo', select: 'author isDeleted', populate: { path: 'author', select: 'name' } },
]

export function serializeComment(comment, replyCount = 0) {
  return {
    id: String(comment._id),
    parentId: comment.parent ? String(comment.parent) : null,
    content: comment.isDeleted ? '' : comment.content,
    author:
      !comment.isDeleted && comment.author
        ? {
            id: String(comment.author._id),
            name: comment.author.name,
            avatar: comment.author.avatar,
          }
        : null,
    replyTo:
      !comment.isDeleted && comment.replyTo
        ? {
            id: String(comment.replyTo._id),
            authorName: comment.replyTo.isDeleted ? null : comment.replyTo.author?.name || null,
          }
        : null,
    isDeleted: comment.isDeleted,
    editedAt: comment.isDeleted ? null : comment.editedAt,
    createdAt: comment.createdAt,
    replyCount,
  }
}

export async function commentResponse(comment) {
  await comment.populate(commentPopulation)
  const [commentCount, replyCount] = await Promise.all([
    countComments(comment.post),
    Comment.countDocuments({ post: comment.post, parent: comment.parent || comment._id }),
  ])
  return {
    comment: serializeComment(comment, comment.parent ? 0 : replyCount),
    commentCount,
    replyCount,
  }
}
