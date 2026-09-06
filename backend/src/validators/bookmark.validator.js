import { z } from 'zod'

export const bookmarkSchema = z.object({ saved: z.boolean() })
