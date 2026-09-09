import { Follow } from '../models/follow.model.js'
import { User } from '../models/user.model.js'
import ApiError from '../utils/ApiError.js'
import { logger } from '../config/logger.js'

async function requireUser(userId) {
  if (!(await User.exists({ _id: userId }))) {
    throw new ApiError(404, 'This user could not be found.')
  }
}

export async function getFollowSummary(userId, viewerId) {
  await requireUser(userId)
  const [followerCount, followingCount, ownFollow] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId }),
    viewerId ? Follow.exists({ follower: viewerId, following: userId }) : null,
  ])

  return { followerCount, followingCount, followedByMe: !!ownFollow }
}

export async function setFollowing({ followerId, followingId, followed, requestId }) {
  if (String(followerId).toLowerCase() === String(followingId).toLowerCase()) {
    throw new ApiError(400, 'You cannot follow yourself.')
  }
  await requireUser(followingId)

  const filter = { follower: followerId, following: followingId }
  let changed = false

  if (followed) {
    // Wait for the unique index before accepting the first follow request.
    await Follow.init()
    try {
      const result = await Follow.updateOne(
        filter,
        { $setOnInsert: filter },
        { upsert: true, runValidators: true },
      )
      changed = !!result.upsertedId
      if (changed) {
        try {
          await requireUser(followingId)
        } catch (error) {
          if (error.status === 404) await Follow.deleteOne({ _id: result.upsertedId })
          throw error
        }
      }
    } catch (error) {
      // Concurrent requests for the same relationship still represent one follow.
      if (error.code !== 11000) throw error
    }
  } else {
    const result = await Follow.deleteOne(filter)
    changed = result.deletedCount > 0
  }

  if (changed) {
    logger.info(followed ? 'User followed' : 'User unfollowed', {
      followerId: String(followerId),
      followingId: String(followingId),
      requestId,
    })
  }

  return getFollowSummary(followingId, followerId)
}
