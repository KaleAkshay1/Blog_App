import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { validateEnv } from '../config/env.js'
import { closeLogger, logger } from '../config/logger.js'
import { seedDatabase } from './seed-data.js'

try {
  validateEnv()
  await connectDatabase()
  const count = await seedDatabase()
  logger.info(
    count ? `Created ${count} sample stories.` : 'Stories already exist. Nothing was changed.',
  )
} catch (error) {
  logger.error('Could not seed the database', { message: error.message, stack: error.stack })
  process.exitCode = 1
} finally {
  await disconnectDatabase()
  await closeLogger()
}
