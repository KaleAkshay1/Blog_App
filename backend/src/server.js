import app from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { config, validateEnv } from './config/env.js'
import { closeLogger, logger } from './config/logger.js'
import { seedDatabase } from './seeders/seed-data.js'

let server
let shuttingDown = false

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info(`${signal} received; shutting down`)
  if (server) await new Promise((resolve) => server.close(resolve))
  await disconnectDatabase()
  await closeLogger()
}

try {
  validateEnv()
  await connectDatabase()
  if (!config.production && !process.env.JWT_SECRET)
    logger.warn(
      'Using an ephemeral development session secret; sessions reset when the API restarts',
    )
  if (config.seedOnStart) {
    const count = await seedDatabase()
    if (count) logger.info(`Added ${count} sample stories`)
  }
  server = app.listen(config.port, config.host, () =>
    logger.info(`Story API is ready at http://${config.host}:${config.port}/api`),
  )
  server.on('error', (error) => {
    logger.error('HTTP server error', { message: error.message, stack: error.stack })
    shutdown('Server error').finally(() => {
      process.exitCode = 1
    })
  })
  process.once('SIGINT', () => {
    shutdown('SIGINT').finally(() => process.exit())
  })
  process.once('SIGTERM', () => {
    shutdown('SIGTERM').finally(() => process.exit())
  })
} catch (error) {
  logger.error('Could not start Story API', { message: error.message, stack: error.stack })
  logger.error('Start MongoDB locally or configure MONGODB_URI in backend/.env')
  await disconnectDatabase().catch(() => {})
  await closeLogger()
  process.exitCode = 1
}
