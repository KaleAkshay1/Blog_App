import { config } from '../config/env.js'

export function checkOrigin(req, res, next) {
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  if (isMutation && req.headers.origin && !config.origins.includes(req.headers.origin)) {
    return res.status(403).json({ message: 'This origin is not allowed.' })
  }
  next()
}
