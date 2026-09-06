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

const router = Router()

router.get('/', listPosts)
router.get('/:slug', getPost)
router.post('/', requireAuth, createPost)
router.put('/:id', requireAuth, validateStoryId, updatePost)
router.delete('/:id', requireAuth, validateStoryId, deletePost)

export default router
