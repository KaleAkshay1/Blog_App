import { z } from 'zod'

export const likeSchema = z.object({ liked: z.boolean() })

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Write a comment before posting.')
    .max(2000, 'Keep your comment within 2,000 characters.'),
})

export const commentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
})
