import { Router } from 'express'
import { subscribe } from '../controllers/newsletter.controller.js'
import { authLimiter } from '../middleware/rate-limit.middleware.js'

const router = Router()

router.post('/', authLimiter, subscribe)

export default router
