import bcrypt from 'bcryptjs'
import { logger } from '../config/logger.js'
import { User } from '../models/user.model.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { publicUser } from '../utils/serializers.js'
import { cookieOptions, createSession } from '../utils/session.js'
import { loginSchema, registerSchema } from '../validators/auth.validator.js'

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body)
  const user = await User.create({ ...data, password: await bcrypt.hash(data.password, 12) })
  createSession(res, user)
  logger.info('Account registered', { userId: user.id, requestId: req.requestId })
  return res.status(201).json(new ApiResponse(201, { user: publicUser(user) }))
})

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body)
  const user = await User.findOne({ email: data.email }).select('+password')
  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new ApiError(401, 'The email or password is incorrect.')
  }
  createSession(res, user)
  logger.info('User signed in', { userId: user.id, requestId: req.requestId })
  return res.status(200).json(new ApiResponse(200, { user: publicUser(user) }))
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('story_session', cookieOptions)
  logger.info('User signed out', { userId: req.user?.id, requestId: req.requestId })
  return res.status(200).json(new ApiResponse(200, null, 'Signed out.'))
})

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user ? publicUser(req.user) : null }))
})
