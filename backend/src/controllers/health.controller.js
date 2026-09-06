import mongoose from 'mongoose'

export function getHealth(req, res) {
  const connected = mongoose.connection.readyState === 1
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
  })
}
