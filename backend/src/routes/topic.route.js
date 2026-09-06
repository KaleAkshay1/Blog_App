import { Router } from 'express'
import { listTopics } from '../controllers/topic.controller.js'

const router = Router()

router.get('/', listTopics)

export default router
