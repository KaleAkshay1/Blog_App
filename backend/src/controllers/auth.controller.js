import bcrypt from 'bcryptjs'
import { logger } from '../config/logger.js'
import { User } from '../models/user.model.js'
import { AppError } from '../utils/app-error.js'
import { publicUser } from '../utils/serializers.js'
import { cookieOptions, createSession } from '../utils/session.js'
import { loginSchema, registerSchema } from '../validators/auth.validator.js'

export async function register(req, res) {
  const data = registerSchema.parse(req.body)
  const user = await User.create({ ...data, password: await bcrypt.hash(data.password, 12) })
  createSession(res, user)
  logger.info('Account registered', { userId: user.id, requestId: req.requestId })
  res.status(201).json({ user: publicUser(user) })
}

export async function login(req, res) {
  const data = loginSchema.parse(req.body)
  const user = await User.findOne({ email: data.email }).select('+password')
  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new AppError(401, 'The email or password is incorrect.')
  }
  createSession(res, user)
  logger.info('User signed in', { userId: user.id, requestId: req.requestId })
  res.json({ user: publicUser(user) })
}

export function logout(req, res) {
  res.clearCookie('story_session', cookieOptions)
  logger.info('User signed out', { userId: req.user?.id, requestId: req.requestId })
  res.json({ message: 'Signed out.' })
}

export function getCurrentUser(req, res) {
  res.json({ user: req.user ? publicUser(req.user) : null })
}
