import mongoose from 'mongoose'

export function validateNotificationId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.notificationId)) {
    return res.status(400).json({ message: 'Invalid notification ID.' })
  }
  next()
}

export function validateStoryId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid story ID.' })
  }
  next()
}

export function validateCommentId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID.' })
  }
  next()
}
