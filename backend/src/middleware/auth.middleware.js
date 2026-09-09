import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { User } from '../models/user.model.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// Public routes can use the session too, for example when an author reads a draft.
export const loadSession = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.story_session
    if (token) {
      const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
      req.user = await User.findById(payload.sub)
    }
  } catch (error) {
    if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
      throw error
    }
  }
  next()
})

export function requireAuth(req, res, next) {
  if (!req.user) return next(new ApiError(401, 'Please sign in to continue.'))
  next()
}
