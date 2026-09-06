import { z } from 'zod'
import { CATEGORIES } from '../constants/categories.js'

export const postSchema = z.object({
  title: z.string().trim().min(5, 'Your title needs at least 5 characters.').max(160),
  excerpt: z.string().trim().min(10, 'Add a short summary of at least 10 characters.').max(320),
  content: z.string().trim().min(20, 'Write at least 20 characters for your story.').max(50000),
  category: z.enum(CATEGORIES),
  coverImage: z
    .union([
      z.literal(''),
      z
        .url()
        .max(2000)
        .refine((value) => value.startsWith('https://'), 'Cover images must use an HTTPS URL.'),
    ])
    .default(''),
  status: z.enum(['draft', 'published']).default('draft'),
})

export const postQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(6),
  search: z.string().trim().max(100).default(''),
  category: z.enum(CATEGORIES).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['latest', 'oldest']).default('latest'),
})
