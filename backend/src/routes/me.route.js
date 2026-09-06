import { Router } from 'express'
import { listOwnPosts } from '../controllers/post.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/posts', requireAuth, listOwnPosts)

export default router
