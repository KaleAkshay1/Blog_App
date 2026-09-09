import { config } from '../config/env.js'
import ApiError from '../utils/ApiError.js'

export function checkOrigin(req, res, next) {
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  if (isMutation && req.headers.origin && !config.origins.includes(req.headers.origin)) {
    return next(new ApiError(403, 'This origin is not allowed.'))
  }
  next()
}
