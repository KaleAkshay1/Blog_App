import { Router } from 'express'
import { followUser, getUserFollow, unfollowUser } from '../controllers/follow.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { followLimiter } from '../middleware/rate-limit.middleware.js'
import { validateUserId } from '../middleware/validate-id.middleware.js'

const router = Router()

router
  .route('/:userId/follow')
  .get(validateUserId, getUserFollow)
  .put(requireAuth, followLimiter, validateUserId, followUser)
  .delete(requireAuth, followLimiter, validateUserId, unfollowUser)

export default router
