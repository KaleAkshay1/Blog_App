import mongoose from 'mongoose'
import { Comment } from '../models/comment.model.js'
import { Notification } from '../models/notification.model.js'
import { notifyActivity } from '../services/notification.service.js'
import { logger } from '../config/logger.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  commentPopulation,
  commentResponse,
  countComments,
  requirePublishedPost,
  serializeComment,
} from '../utils/engagement.js'
import { commentQuerySchema, commentSchema } from '../validators/engagement.validator.js'

async function verifyNewCommentPost(comment) {
  try {
    await requirePublishedPost(comment.post)
  } catch (error) {
    // A post can be deleted or unpublished while a comment is being created.
    if (error.status === 404) await Comment.deleteOne({ _id: comment._id })
    throw error
  }
}

export const listComments = asyncHandler(async (req, res) => {
  const { page, limit } = commentQuerySchema.parse(req.query)
  await requirePublishedPost(req.params.id)
  const filter = { post: req.params.id, parent: null }
  const [comments, total, commentCount] = await Promise.all([
    Comment.find(filter)
      .populate(commentPopulation)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Comment.countDocuments(filter),
    countComments(req.params.id),
  ])
  const replyCounts = comments.length
    ? await Comment.aggregate([
        {
          $match: {
            post: new mongoose.Types.ObjectId(req.params.id),
            parent: { $in: comments.map((comment) => comment._id) },
          },
        },
        { $group: { _id: '$parent', count: { $sum: 1 } } },
      ])
    : []
  const counts = new Map(replyCounts.map((item) => [String(item._id), item.count]))
  return res.status(200).json(
    new ApiResponse(200, {
      comments: comments.map((comment) => serializeComment(comment, counts.get(comment.id) || 0)),
      total,
      commentCount,
      page,
      pages: Math.ceil(total / limit),
    }),
  )
})

export const createComment = asyncHandler(async (req, res) => {
  const { content } = commentSchema.parse(req.body)
  const post = await requirePublishedPost(req.params.id)
  const comment = await Comment.create({ post: req.params.id, author: req.user._id, content })
  await verifyNewCommentPost(comment)
  await notifyActivity({
    type: 'comment',
    actor: req.user._id,
    post: req.params.id,
    comment: comment._id,
    recipients: [post.author],
  })
  logger.info('Comment created', {
    postId: req.params.id,
    commentId: comment.id,
    userId: req.user.id,
    requestId: req.requestId,
  })
  return res.status(201).json(new ApiResponse(201, await commentResponse(comment)))
})

export const listReplies = asyncHandler(async (req, res) => {
  const { page, limit } = commentQuerySchema.parse(req.query)
  await requirePublishedPost(req.params.id)
  const parent = await Comment.findOne({
    _id: req.params.commentId,
    post: req.params.id,
    parent: null,
  })
  if (!parent) throw new ApiError(404, 'This comment thread could not be found.')
  const filter = { post: req.params.id, parent: parent._id }
  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate(commentPopulation)
      .sort({ createdAt: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Comment.countDocuments(filter),
  ])
  return res.status(200).json(
    new ApiResponse(200, {
      comments: comments.map((comment) => serializeComment(comment)),
      total,
      page,
      pages: Math.ceil(total / limit),
    }),
  )
})

export const createReply = asyncHandler(async (req, res) => {
  const { content } = commentSchema.parse(req.body)
  const post = await requirePublishedPost(req.params.id)
  const target = await Comment.findOne({
    _id: req.params.commentId,
    post: req.params.id,
    isDeleted: false,
  })
  if (!target) throw new ApiError(404, 'This comment is no longer available to reply to.')
  const comment = await Comment.create({
    post: req.params.id,
    author: req.user._id,
    content,
    parent: target.parent || target._id,
    replyTo: target._id,
  })
  await verifyNewCommentPost(comment)
  await notifyActivity({
    type: 'reply',
    actor: req.user._id,
    post: req.params.id,
    comment: comment._id,
    recipients: [post.author, target.author],
  })
  logger.info('Reply created', {
    postId: req.params.id,
    commentId: comment.id,
    parentId: String(comment.parent),
    userId: req.user.id,
    requestId: req.requestId,
  })
  return res.status(201).json(new ApiResponse(201, await commentResponse(comment)))
})

async function ownedComment(req) {
  await requirePublishedPost(req.params.id)
  const comment = await Comment.findOne({ _id: req.params.commentId, post: req.params.id })
  if (!comment) throw new ApiError(404, 'This comment could not be found.')
  if (String(comment.author) !== req.user.id)
    throw new ApiError(403, 'You can only change your own comments.')
  return comment
}

export const updateComment = asyncHandler(async (req, res) => {
  const { content } = commentSchema.parse(req.body)
  const existing = await ownedComment(req)
  const comment = await Comment.findOneAndUpdate(
    { _id: existing._id, isDeleted: false },
    { $set: { content, editedAt: new Date() } },
    { returnDocument: 'after', runValidators: true },
  )
  if (!comment) throw new ApiError(404, 'This comment has been deleted.')
  logger.info('Comment updated', {
    postId: req.params.id,
    commentId: comment.id,
    userId: req.user.id,
    requestId: req.requestId,
  })
  return res.status(200).json(new ApiResponse(200, await commentResponse(comment)))
})

export const deleteComment = asyncHandler(async (req, res) => {
  const existing = await ownedComment(req)
  // Remove the text but retain the thread so other people's replies survive.
  const comment = await Comment.findByIdAndUpdate(
    existing._id,
    { $set: { content: '', isDeleted: true, editedAt: null } },
    { returnDocument: 'after' },
  )
  if (!comment) throw new ApiError(404, 'This comment could not be found.')
  logger.info('Comment deleted', {
    postId: req.params.id,
    commentId: comment.id,
    userId: req.user.id,
    requestId: req.requestId,
  })
  await Notification.deleteMany({ comment: comment._id })
  return res.status(200).json(new ApiResponse(200, await commentResponse(comment)))
})
