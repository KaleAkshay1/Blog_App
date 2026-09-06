import mongoose from 'mongoose'
import { config } from './env.js'
import { logger } from './logger.js'

mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected', {
    host: mongoose.connection.host,
    database: mongoose.connection.name,
  })
})
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'))
mongoose.connection.on('disconnected', () => logger.info('MongoDB disconnected'))
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', { message: error.message, stack: error.stack })
})

export async function connectDatabase() {
  logger.info('Connecting to MongoDB...')
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 })
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}
