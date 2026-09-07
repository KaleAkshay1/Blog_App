import { randomUUID } from 'node:crypto'
import { logger } from '../config/logger.js'

export function requestLogger(req, res, next) {
  const startedAt = performance.now()
  // Keep query strings, request bodies, and session cookies out of logs.
  const path = req.originalUrl.split('?')[0]
  req.requestId = randomUUID()
  res.setHeader('X-Request-ID', req.requestId)

  res.once('finish', () => {
    const status = res.statusCode
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'http'
    logger.log(level, `${req.method} ${path} ${status}`, {
      requestId: req.requestId,
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
    })
  })

  next()
}
