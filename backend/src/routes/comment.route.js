import { Router } from 'express'
import {
  createComment,
  createReply,
  deleteComment,
  listComments,
  listReplies,
  updateComment,
} from '../controllers/comment.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { commentLimiter } from '../middleware/rate-limit.middleware.js'
import { validateCommentId, validateStoryId } from '../middleware/validate-id.middleware.js'

const router = Router({ mergeParams: true })

router.use(validateStoryId)
router.get('/', listComments)
router.post('/', requireAuth, commentLimiter, createComment)
router.get('/:commentId/replies', validateCommentId, listReplies)
router.post('/:commentId/replies', requireAuth, commentLimiter, validateCommentId, createReply)
router.patch('/:commentId', requireAuth, commentLimiter, validateCommentId, updateComment)
router.delete('/:commentId', requireAuth, validateCommentId, deleteComment)

export default router
