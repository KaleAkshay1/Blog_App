import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { User } from '../models/user.model.js'

// Public routes can use the session too, for example when an author reads a draft.
export async function loadSession(req, res, next) {
  try {
    const token = req.cookies.story_session
    if (token) {
      const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
      req.user = await User.findById(payload.sub)
    }
  } catch (error) {
    if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
      return next(error)
    }
  }
  next()
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Please sign in to continue.' })
  next()
}
