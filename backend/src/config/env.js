import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true })

const production = process.env.NODE_ENV === 'production'

export const config = {
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || '127.0.0.1',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/story_blog',
  jwtSecret: process.env.JWT_SECRET || randomBytes(48).toString('hex'),
  origins: (
    process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:4173'
  )
    .split(',')
    .map((value) => value.trim()),
  production,
  seedOnStart: process.env.SEED_ON_START ? process.env.SEED_ON_START === 'true' : !production,
  logLevel: process.env.LOG_LEVEL || 'http',
  logToFile: process.env.LOG_TO_FILE !== 'false',
}

export function validateEnv() {
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.')
  }
  if (production && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error('Set JWT_SECRET to a random string of at least 32 characters in production.')
  }
  if (production && !process.env.MONGODB_URI)
    throw new Error('MONGODB_URI is required in production.')
  if (production && !process.env.CLIENT_URL)
    throw new Error('CLIENT_URL is required in production.')
  if (!['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'].includes(config.logLevel)) {
    throw new Error('LOG_LEVEL must be error, warn, info, http, verbose, debug, or silly.')
  }
}
