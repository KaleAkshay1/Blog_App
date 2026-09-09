import rateLimit from 'express-rate-limit'
import ApiError from '../utils/ApiError.js'

const commonOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new ApiError(options.statusCode, options.message))
  },
}

export const apiLimiter = rateLimit({
  ...commonOptions,
  limit: 500,
  message: 'Too many requests. Please try again shortly.',
})

export const authLimiter = rateLimit({
  ...commonOptions,
  limit: 30,
  message: 'Too many sign-in attempts. Try again in 15 minutes.',
})

export const commentLimiter = rateLimit({
  ...commonOptions,
  limit: 60,
  keyGenerator: (req) => req.user.id,
  message: 'You have posted quite a bit. Please wait a few minutes before writing again.',
})

export const socialLimiter = rateLimit({
  ...commonOptions,
  limit: 60,
  keyGenerator: (req) => req.user.id,
  message: 'Please wait a few minutes before sending more likes, shares, or reports.',
})

export const followLimiter = rateLimit({
  ...commonOptions,
  limit: 60,
  keyGenerator: (req) => req.user.id,
  message: 'Please wait a few minutes before following or unfollowing more people.',
})
