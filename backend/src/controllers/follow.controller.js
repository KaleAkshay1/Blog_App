import { getFollowSummary, setFollowing } from '../services/follow.service.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

export const getUserFollow = asyncHandler(async (req, res) => {
  const summary = await getFollowSummary(req.params.userId, req.user?._id)
  return res.status(200).set('Cache-Control', 'no-store').json(new ApiResponse(200, summary))
})

export const followUser = asyncHandler(async (req, res) => {
  const summary = await setFollowing({
    followerId: req.user._id,
    followingId: req.params.userId,
    followed: true,
    requestId: req.requestId,
  })
  return res.status(200).set('Cache-Control', 'no-store').json(new ApiResponse(200, summary))
})

export const unfollowUser = asyncHandler(async (req, res) => {
  const summary = await setFollowing({
    followerId: req.user._id,
    followingId: req.params.userId,
    followed: false,
    requestId: req.requestId,
  })
  return res.status(200).set('Cache-Control', 'no-store').json(new ApiResponse(200, summary))
})
