import { Post } from '../models/post.model.js'
import { logger } from '../config/logger.js'
import { User } from '../models/user.model.js'
import { Like } from '../models/like.model.js'
import { Comment } from '../models/comment.model.js'
import { Notification } from '../models/notification.model.js'
import { Report } from '../models/report.model.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { calculateReadTime, createSlug, populateAuthor } from '../utils/post.js'
import { serializePost } from '../utils/serializers.js'
import { postQuerySchema, postSchema } from '../validators/post.validator.js'

export const listPosts = asyncHandler(async (req, res) => {
  const query = postQuerySchema.parse(req.query)
  const filter = { status: 'published' }
  if (query.category) filter.category = query.category
  if (query.featured) filter.featured = query.featured === 'true'
  if (query.search) {
    const regex = {
      $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i',
    }
    filter.$or = [{ title: regex }, { excerpt: regex }, { category: regex }]
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .select('-content')
      .populate(populateAuthor)
      .sort({ publishedAt: query.sort === 'latest' ? -1 : 1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Post.countDocuments(filter),
  ])
  return res.status(200).json(
    new ApiResponse(200, {
      posts: posts.map(serializePost),
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    }),
  )
})

export const listOwnPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user._id })
    .select('-content')
    .populate(populateAuthor)
    .sort({ updatedAt: -1 })
  return res.status(200).json(new ApiResponse(200, { posts: posts.map(serializePost) }))
})

export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate(populateAuthor)
  const isOwner = post && String(post.author?._id) === req.user?.id
  if (!post || (post.status !== 'published' && !isOwner)) {
    throw new ApiError(404, 'This story could not be found.')
  }
  return res.status(200).json(new ApiResponse(200, { post: serializePost(post) }))
})

export const createPost = asyncHandler(async (req, res) => {
  const data = postSchema.parse(req.body)
  const post = await Post.create({
    ...data,
    author: req.user._id,
    slug: createSlug(data.title),
    readTime: calculateReadTime(data.content),
    publishedAt: data.status === 'published' ? new Date() : null,
  })
  await post.populate(populateAuthor)
  logger.info('Story created', { postId: post.id, status: post.status, requestId: req.requestId })
  return res.status(201).json(new ApiResponse(201, { post: serializePost(post) }))
})

export const updatePost = asyncHandler(async (req, res) => {
  const data = postSchema.parse(req.body)
  const post = await Post.findById(req.params.id)
  if (!post) throw new ApiError(404, 'This story could not be found.')
  if (String(post.author) !== req.user.id) {
    throw new ApiError(403, 'You can only edit your own stories.')
  }
  Object.assign(post, data, { readTime: calculateReadTime(data.content) })
  if (post.status === 'published' && !post.publishedAt) post.publishedAt = new Date()
  await post.save()
  await post.populate(populateAuthor)
  logger.info('Story updated', { postId: post.id, status: post.status, requestId: req.requestId })
  return res.status(200).json(new ApiResponse(200, { post: serializePost(post) }))
})

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
  if (!post) throw new ApiError(404, 'This story could not be found.')
  if (String(post.author) !== req.user.id) {
    throw new ApiError(403, 'You can only delete your own stories.')
  }
  await post.deleteOne()
  await Like.deleteMany({ post: post._id })
  await Comment.deleteMany({ post: post._id })
  await Notification.deleteMany({ post: post._id })
  await Report.deleteMany({ post: post._id })
  await User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } })
  logger.info('Story deleted', { postId: post.id, requestId: req.requestId })
  return res.status(200).json(new ApiResponse(200, null, 'Story deleted.'))
})
