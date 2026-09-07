import { z } from 'zod'
import { emailSchema } from './auth.validator.js'

export const shareSchema = z.object({ email: emailSchema })
export const reportSchema = z.object({
  reason: z.enum(['spam', 'harassment', 'misinformation', 'copyright', 'other']),
  details: z.string().trim().max(2000).default(''),
})
export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(20),
})
