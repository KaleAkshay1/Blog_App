import mongoose from 'mongoose'
import ApiError from '../utils/ApiError.js'

export function validateUserId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return next(new ApiError(400, 'Invalid user ID.'))
  }
  next()
}

export function validateNotificationId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.notificationId)) {
    return next(new ApiError(400, 'Invalid notification ID.'))
  }
  next()
}

export function validateStoryId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ApiError(400, 'Invalid story ID.'))
  }
  next()
}

export function validateCommentId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.commentId)) {
    return next(new ApiError(400, 'Invalid comment ID.'))
  }
  next()
}
