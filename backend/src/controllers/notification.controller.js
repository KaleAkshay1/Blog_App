import { Notification } from '../models/notification.model.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { notificationQuerySchema } from '../validators/social.validator.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = notificationQuerySchema.parse(req.query)
  const [result] = await Notification.aggregate([
    { $match: { recipient: req.user._id } },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $lookup: {
        from: 'posts',
        localField: 'post',
        foreignField: '_id',
        as: 'postData',
        pipeline: [{ $project: { title: 1, slug: 1, status: 1 } }],
      },
    },
    { $unwind: '$postData' },
    // Neither notifications nor unread counts reveal private or deleted stories.
    { $match: { 'postData.status': 'published' } },
    {
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'actor',
              foreignField: '_id',
              as: 'actorData',
              pipeline: [{ $project: { name: 1, avatar: 1 } }],
            },
          },
          {
            $project: {
              type: 1,
              readAt: 1,
              createdAt: 1,
              postData: 1,
              actorData: { $arrayElemAt: ['$actorData', 0] },
            },
          },
        ],
        counts: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              unreadCount: { $sum: { $cond: [{ $eq: ['$readAt', null] }, 1, 0] } },
            },
          },
        ],
      },
    },
  ])
  const counts = result.counts[0] || { total: 0, unreadCount: 0 }
  return res
    .status(200)
    .set('Cache-Control', 'no-store')
    .json(
      new ApiResponse(200, {
        notifications: result.items.map((item) => ({
          id: String(item._id),
          type: item.type,
          readAt: item.readAt,
          createdAt: item.createdAt,
          actor: item.actorData
            ? {
                id: String(item.actorData._id),
                name: item.actorData.name,
                avatar: item.actorData.avatar,
              }
            : { id: '', name: 'A former member', avatar: '' },
          post: {
            id: String(item.postData._id),
            title: item.postData.title,
            slug: item.postData.slug,
          },
        })),
        total: counts.total,
        unreadCount: counts.unreadCount,
        page,
        pages: Math.ceil(counts.total / limit),
      }),
    )
})

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, recipient: req.user._id },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!notification) throw new ApiError(404, 'This notification could not be found.')
  return res.status(200).json(new ApiResponse(200, null, 'Notification marked as read.'))
})

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
  )
  return res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read.'))
})
