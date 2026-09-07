import { Router } from 'express'
import { listNotifications, markAllRead, markRead } from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { validateNotificationId } from '../middleware/validate-id.middleware.js'

const router = Router()
router.use(requireAuth)
router.get('/', listNotifications)
router.patch('/read-all', markAllRead)
router.patch('/:notificationId/read', validateNotificationId, markRead)

export default router
