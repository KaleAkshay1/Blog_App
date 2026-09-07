import { Router } from 'express'
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from '../controllers/post.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { validateStoryId } from '../middleware/validate-id.middleware.js'
import { getEngagement, setLike } from '../controllers/like.controller.js'
import commentRoutes from './comment.route.js'
import shareRoutes from './share.route.js'
import reportRoutes from './report.route.js'
import { socialLimiter } from '../middleware/rate-limit.middleware.js'

const router = Router()

router.use('/:id/comments', commentRoutes)
router.use('/:id/share', shareRoutes)
router.use('/:id/reports', reportRoutes)
router.get('/:id/engagement', validateStoryId, getEngagement)
router.put('/:id/like', requireAuth, socialLimiter, validateStoryId, setLike)
router.get('/', listPosts)
router.get('/:slug', getPost)
router.post('/', requireAuth, createPost)
router.put('/:id', requireAuth, validateStoryId, updatePost)
router.delete('/:id', requireAuth, validateStoryId, deletePost)

export default router
