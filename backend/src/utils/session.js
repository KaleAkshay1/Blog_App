import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

export const cookieOptions = {
  httpOnly: true,
  secure: config.production,
  sameSite: 'lax',
  path: '/',
}

export function createSession(res, user) {
  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' })
  res.cookie('story_session', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
}
