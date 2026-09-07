import { Router } from 'express'
import { loadSession } from '../middleware/auth.middleware.js'
import { apiNotFound } from '../middleware/error.middleware.js'
import authRoutes from './auth.route.js'
import postRoutes from './post.route.js'
import meRoutes from './me.route.js'
import bookmarkRoutes from './bookmark.route.js'
import topicRoutes from './topic.route.js'
import newsletterRoutes from './newsletter.route.js'
import healthRoutes from './health.route.js'
import notificationRoutes from './notification.route.js'

const router = Router()

// Health checks remain available without looking up a session.
router.use('/health', healthRoutes)
router.use(loadSession)
router.use('/auth', authRoutes)
router.use('/posts', postRoutes)
router.use('/me', meRoutes)
router.use('/bookmarks', bookmarkRoutes)
router.use('/topics', topicRoutes)
router.use('/newsletter', newsletterRoutes)
router.use('/notifications', notificationRoutes)
router.use(apiNotFound)

export default router
