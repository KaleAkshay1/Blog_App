import { getFollowSummary, setFollowing } from '../services/follow.service.js'

export async function getUserFollow(req, res) {
  const summary = await getFollowSummary(req.params.userId, req.user?._id)
  res.set('Cache-Control', 'no-store').json(summary)
}

export async function followUser(req, res) {
  const summary = await setFollowing({
    followerId: req.user._id,
    followingId: req.params.userId,
    followed: true,
    requestId: req.requestId,
  })
  res.set('Cache-Control', 'no-store').json(summary)
}

export async function unfollowUser(req, res) {
  const summary = await setFollowing({
    followerId: req.user._id,
    followingId: req.params.userId,
    followed: false,
    requestId: req.requestId,
  })
  res.set('Cache-Control', 'no-store').json(summary)
}
