import { CATEGORIES } from '../constants/categories.js'
import { Post } from '../models/post.model.js'

export async function listTopics(req, res) {
  const counts = await Post.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  res.json({
    topics: CATEGORIES.map((name) => ({
      name,
      count: counts.find((item) => item._id === name)?.count || 0,
    })),
  })
}
