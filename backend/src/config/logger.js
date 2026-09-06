import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import winston from 'winston'
import { config } from './env.js'

const { combine, timestamp, errors, printf, colorize, json } = winston.format
const redactConnectionStrings = winston.format((info) => {
  for (const key of ['message', 'stack']) {
    if (typeof info[key] === 'string') {
      info[key] = info[key].replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[redacted MongoDB URI]')
    }
  }
  return info
})

const consoleFormat = combine(
  ...(process.stdout.isTTY && !config.production ? [colorize()] : []),
  printf(({ timestamp: time, level, message, service, stack, ...metadata }) => {
    const details = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : ''
    const trace = stack ? `\n${stack}` : ''
    return `${time} [${service}] ${level}: ${message}${details}${trace}`
  }),
)

const transports = [new winston.transports.Console({ format: consoleFormat })]

if (config.logToFile) {
  const logDirectory = fileURLToPath(new URL('../../logs/', import.meta.url))
  mkdirSync(logDirectory, { recursive: true })
  const fileOptions = { format: json(), maxsize: 5 * 1024 * 1024, maxFiles: 5, tailable: true }
  transports.push(
    new winston.transports.File({ ...fileOptions, filename: join(logDirectory, 'combined.log') }),
    new winston.transports.File({
      ...fileOptions,
      filename: join(logDirectory, 'error.log'),
      level: 'error',
    }),
  )
}

export const logger = winston.createLogger({
  level: Object.hasOwn(winston.config.npm.levels, config.logLevel) ? config.logLevel : 'http',
  defaultMeta: { service: 'story-api' },
  format: combine(
    errors({ stack: true }),
    redactConnectionStrings(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  ),
  transports,
})

export function closeLogger() {
  return new Promise((resolve) => {
    logger.once('finish', resolve)
    logger.end()
  })
}
