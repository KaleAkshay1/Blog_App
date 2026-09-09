import { CATEGORIES } from '../constants/categories.js'
import { Post } from '../models/post.model.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

export const listTopics = asyncHandler(async (req, res) => {
  const counts = await Post.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  return res.status(200).json(
    new ApiResponse(200, {
      topics: CATEGORIES.map((name) => ({
        name,
        count: counts.find((item) => item._id === name)?.count || 0,
      })),
    }),
  )
})
