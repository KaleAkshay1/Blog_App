import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { config } from './config/env.js'
import { apiLimiter } from './middleware/rate-limit.middleware.js'
import { checkOrigin } from './middleware/origin.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'
import { requestLogger } from './middleware/request-logger.middleware.js'
import apiRoutes from './routes/index.js'

const app = express()

app.disable('x-powered-by')
app.use(requestLogger)
app.use(helmet())
app.use(cors({ origin: config.origins, credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

app.use('/api', apiLimiter, checkOrigin, apiRoutes)
app.use(errorHandler)

export default app
