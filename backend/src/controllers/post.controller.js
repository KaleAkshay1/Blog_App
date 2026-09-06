import { Post } from '../models/post.model.js'
import { User } from '../models/user.model.js'
import { AppError } from '../utils/app-error.js'
import { calculateReadTime, createSlug, populateAuthor } from '../utils/post.js'
import { serializePost } from '../utils/serializers.js'
import { postQuerySchema, postSchema } from '../validators/post.validator.js'

export async function listPosts(req, res) {
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
  res.json({
    posts: posts.map(serializePost),
    total,
    page: query.page,
    pages: Math.ceil(total / query.limit),
  })
}

export async function listOwnPosts(req, res) {
  const posts = await Post.find({ author: req.user._id })
    .select('-content')
    .populate(populateAuthor)
    .sort({ updatedAt: -1 })
  res.json({ posts: posts.map(serializePost) })
}

export async function getPost(req, res) {
  const post = await Post.findOne({ slug: req.params.slug }).populate(populateAuthor)
  const isOwner = post && String(post.author?._id) === req.user?.id
  if (!post || (post.status !== 'published' && !isOwner)) {
    throw new AppError(404, 'This story could not be found.')
  }
  res.json({ post: serializePost(post) })
}

export async function createPost(req, res) {
  const data = postSchema.parse(req.body)
  const post = await Post.create({
    ...data,
    author: req.user._id,
    slug: createSlug(data.title),
    readTime: calculateReadTime(data.content),
    publishedAt: data.status === 'published' ? new Date() : null,
  })
  await post.populate(populateAuthor)
  res.status(201).json({ post: serializePost(post) })
}

export async function updatePost(req, res) {
  const data = postSchema.parse(req.body)
  const post = await Post.findById(req.params.id)
  if (!post) throw new AppError(404, 'This story could not be found.')
  if (String(post.author) !== req.user.id) {
    throw new AppError(403, 'You can only edit your own stories.')
  }
  Object.assign(post, data, { readTime: calculateReadTime(data.content) })
  if (post.status === 'published' && !post.publishedAt) post.publishedAt = new Date()
  await post.save()
  await post.populate(populateAuthor)
  res.json({ post: serializePost(post) })
}

export async function deletePost(req, res) {
  const post = await Post.findById(req.params.id)
  if (!post) throw new AppError(404, 'This story could not be found.')
  if (String(post.author) !== req.user.id) {
    throw new AppError(403, 'You can only delete your own stories.')
  }
  await post.deleteOne()
  await User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } })
  res.json({ message: 'Story deleted.' })
}
