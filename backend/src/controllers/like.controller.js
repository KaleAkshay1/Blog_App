import { Like } from '../models/like.model.js'
import { Notification } from '../models/notification.model.js'
import { notifyActivity } from '../services/notification.service.js'
import { logger } from '../config/logger.js'
import { likeSchema } from '../validators/engagement.validator.js'
import { countComments, requirePublishedPost } from '../utils/engagement.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

async function likeSummary(postId, userId) {
  const [likeCount, ownLike] = await Promise.all([
    Like.countDocuments({ post: postId }),
    userId ? Like.exists({ post: postId, user: userId }) : null,
  ])
  return { likeCount, likedByMe: !!ownLike }
}

export const getEngagement = asyncHandler(async (req, res) => {
  await requirePublishedPost(req.params.id)
  const [likes, commentCount] = await Promise.all([
    likeSummary(req.params.id, req.user?._id),
    countComments(req.params.id),
  ])
  return res
    .status(200)
    .set('Cache-Control', 'no-store')
    .json(new ApiResponse(200, { ...likes, commentCount }))
})

export const setLike = asyncHandler(async (req, res) => {
  const { liked } = likeSchema.parse(req.body)
  const post = await requirePublishedPost(req.params.id)
  const filter = { post: req.params.id, user: req.user._id }

  if (liked) {
    await Like.init()
    try {
      const result = await Like.updateOne(filter, { $setOnInsert: filter }, { upsert: true })
      if (result.upsertedId) {
        try {
          await requirePublishedPost(req.params.id)
        } catch (error) {
          if (error.status === 404) await Like.deleteOne({ _id: result.upsertedId })
          throw error
        }
        await notifyActivity({
          type: 'like',
          actor: req.user._id,
          post: req.params.id,
          recipients: [post.author],
        })
      }
    } catch (error) {
      // Concurrent requests to like the same story still represent one like.
      if (error.code !== 11000) throw error
    }
  } else {
    await Like.deleteOne(filter)
    await Notification.deleteMany({ type: 'like', post: req.params.id, actor: req.user._id })
  }

  logger.info(liked ? 'Story liked' : 'Story like removed', {
    postId: req.params.id,
    userId: req.user.id,
    requestId: req.requestId,
  })
  return res
    .status(200)
    .set('Cache-Control', 'no-store')
    .json(new ApiResponse(200, await likeSummary(req.params.id, req.user._id)))
})
