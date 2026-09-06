import { z } from 'zod'

export const emailSchema = z.string().trim().toLowerCase().email().max(254)

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Use at least 8 characters for your password.')
    .max(72)
    .refine(
      (value) => Buffer.byteLength(value, 'utf8') <= 72,
      'Your password must be at most 72 UTF-8 bytes.',
    ),
})

export const registerSchema = loginSchema.extend({ name: z.string().trim().min(2).max(60) })
