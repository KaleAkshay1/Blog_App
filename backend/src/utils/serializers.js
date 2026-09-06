export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  bookmarks: user.bookmarks.map(String),
})

export function serializePost(post) {
  const data = post.toObject ? post.toObject() : post
  return {
    ...data,
    id: String(data._id),
    _id: undefined,
    __v: undefined,
    author: data.author
      ? { id: String(data.author._id), name: data.author.name, avatar: data.author.avatar }
      : { id: '', name: 'Story Editorial', avatar: '' },
  }
}
