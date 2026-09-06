import { z } from 'zod'
import { logger } from '../config/logger.js'

export function apiNotFound(req, res) {
  res.status(404).json({ message: 'API route not found.' })
}

// Express 5 forwards rejected async controllers here automatically.
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: error.issues[0]?.message || 'Please check your input.' })
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'An account with this email already exists.' })
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body.' })
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Your story is too large.' })
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: 'Please check your input.' })
  }

  const status = error.status || 500
  if (status === 500) {
    logger.error('Unhandled request error', {
      message: error.message,
      stack: error.stack,
      method: req.method,
      path: req.originalUrl,
    })
  }
  res.status(status).json({
    message: status === 500 ? 'Something went wrong. Please try again.' : error.message,
  })
}
