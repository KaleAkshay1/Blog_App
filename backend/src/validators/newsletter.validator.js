import { z } from 'zod'
import { emailSchema } from './auth.validator.js'

export const newsletterSchema = z.object({ email: emailSchema })
