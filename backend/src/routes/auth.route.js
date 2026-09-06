import { Router } from 'express'
import { getCurrentUser, login, logout, register } from '../controllers/auth.controller.js'
import { authLimiter } from '../middleware/rate-limit.middleware.js'

const router = Router()

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/logout', logout)
router.get('/me', getCurrentUser)

export default router
