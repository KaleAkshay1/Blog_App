import rateLimit from 'express-rate-limit'

const commonOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}

export const apiLimiter = rateLimit({
  ...commonOptions,
  limit: 500,
  message: { message: 'Too many requests. Please try again shortly.' },
})

export const authLimiter = rateLimit({
  ...commonOptions,
  limit: 30,
  message: { message: 'Too many sign-in attempts. Try again in 15 minutes.' },
})
