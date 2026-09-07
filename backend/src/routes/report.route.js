import { Router } from 'express'
import { reportPost } from '../controllers/report.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { socialLimiter } from '../middleware/rate-limit.middleware.js'
import { validateStoryId } from '../middleware/validate-id.middleware.js'

const router = Router({ mergeParams: true })
router.post('/', requireAuth, socialLimiter, validateStoryId, reportPost)
export default router
