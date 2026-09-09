import { z } from 'zod'
import { logger } from '../config/logger.js'
import ApiError from '../utils/ApiError.js'

export function apiNotFound(req, res, next) {
  next(new ApiError(404, 'API route not found.'))
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  let apiError = error
  if (error instanceof z.ZodError) {
    apiError = new ApiError(
      400,
      error.issues[0]?.message || 'Please check your input.',
      error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    )
  } else if (error.code === 11000) {
    const message =
      error.keyPattern?.email || error.keyValue?.email
        ? 'An account with this email already exists.'
        : 'This record already exists.'
    apiError = new ApiError(409, message)
  } else if (error.type === 'entity.parse.failed') {
    apiError = new ApiError(400, 'Invalid JSON body.')
  } else if (error.type === 'entity.too.large') {
    apiError = new ApiError(413, 'Your story is too large.')
  } else if (error.name === 'ValidationError' || error.name === 'CastError') {
    apiError = new ApiError(400, 'Please check your input.')
  }

  const status =
    Number.isInteger(apiError.status) && apiError.status >= 400 && apiError.status <= 599
      ? apiError.status
      : 500
  if (status === 500) {
    logger.error('Unhandled request error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      requestId: req.requestId,
    })
  }
  const responseError = new ApiError(
    status,
    status === 500 ? 'Something went wrong. Please try again.' : apiError.message,
    status === 500 ? [] : apiError instanceof ApiError ? apiError.error : [],
  )
  return res.status(status).json({
    status: responseError.status,
    success: responseError.success,
    message: responseError.message,
    error: responseError.error,
  })
}
