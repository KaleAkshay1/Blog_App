import app from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { config, validateEnv } from './config/env.js'
import { closeLogger, logger } from './config/logger.js'
import { seedDatabase } from './seeders/seed-data.js'

let server
let shuttingDown = false

async function shutdown(reason, exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info('Shutting down the API', { reason })
  const timeout = setTimeout(() => process.exit(1), 10000)
  timeout.unref()

  try {
    if (server?.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
    await disconnectDatabase()
    logger.info('API shutdown complete')
  } catch (error) {
    logger.error('API shutdown failed', { error: error.message, stack: error.stack })
    exitCode = 1
  } finally {
    await closeLogger()
    clearTimeout(timeout)
    process.exitCode = exitCode
  }
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
    logger.error('HTTP server error', { error: error.message, stack: error.stack })
    void shutdown('Server error', 1)
  })
  process.once('SIGINT', () => {
    void shutdown('SIGINT').finally(() => process.exit(process.exitCode || 0))
  })
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM').finally(() => process.exit(process.exitCode || 0))
  })
} catch (error) {
  logger.error('Could not start Story API', { error: error.message, stack: error.stack })
  if (error.name === 'MongooseServerSelectionError') {
    logger.error('Start MongoDB locally or configure MONGODB_URI in backend/.env')
  }
  await shutdown('Startup failure', 1)
}

console.log("test")