import { Post } from '../models/post.model.js'
import { User } from '../models/user.model.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { populateAuthor } from '../utils/post.js'
import { serializePost } from '../utils/serializers.js'
import { bookmarkSchema } from '../validators/bookmark.validator.js'

export const listBookmarks = asyncHandler(async (req, res) => {
  const posts = await Post.find({
    _id: { $in: req.user.bookmarks },
    status: 'published',
  })
    .select('-content')
    .populate(populateAuthor)
    .sort({ publishedAt: -1 })
  return res.status(200).json(new ApiResponse(200, { posts: posts.map(serializePost) }))
})

export const setBookmark = asyncHandler(async (req, res) => {
  const { saved } = bookmarkSchema.parse(req.body)
  if (saved && !(await Post.exists({ _id: req.params.id, status: 'published' }))) {
    throw new ApiError(404, 'This story could not be found.')
  }
  const update = saved
    ? { $addToSet: { bookmarks: req.params.id } }
    : { $pull: { bookmarks: req.params.id } }
  const user = await User.findByIdAndUpdate(req.user._id, update, { returnDocument: 'after' })
  return res.status(200).json(new ApiResponse(200, { bookmarks: user.bookmarks.map(String) }))
})
