import { Router } from 'express'
import { listBookmarks, setBookmark } from '../controllers/bookmark.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { validateStoryId } from '../middleware/validate-id.middleware.js'

const router = Router()

router.get('/', requireAuth, listBookmarks)
router.put('/:id', requireAuth, validateStoryId, setBookmark)

export default router
