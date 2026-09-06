import { Post } from '../models/post.model.js'
import { User } from '../models/user.model.js'
import { AppError } from '../utils/app-error.js'
import { populateAuthor } from '../utils/post.js'
import { serializePost } from '../utils/serializers.js'
import { bookmarkSchema } from '../validators/bookmark.validator.js'

export async function listBookmarks(req, res) {
  const posts = await Post.find({
    _id: { $in: req.user.bookmarks },
    status: 'published',
  })
    .select('-content')
    .populate(populateAuthor)
    .sort({ publishedAt: -1 })
  res.json({ posts: posts.map(serializePost) })
}

export async function setBookmark(req, res) {
  const { saved } = bookmarkSchema.parse(req.body)
  if (saved && !(await Post.exists({ _id: req.params.id, status: 'published' }))) {
    throw new AppError(404, 'This story could not be found.')
  }
  const update = saved
    ? { $addToSet: { bookmarks: req.params.id } }
    : { $pull: { bookmarks: req.params.id } }
  const user = await User.findByIdAndUpdate(req.user._id, update, { returnDocument: 'after' })
  res.json({ bookmarks: user.bookmarks.map(String) })
}
