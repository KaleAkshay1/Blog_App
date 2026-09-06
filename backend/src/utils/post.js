import { randomBytes } from 'node:crypto'

export const populateAuthor = { path: 'author', select: 'name avatar' }

export function createSlug(title) {
  const base =
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100) || 'story'
  return `${base}-${randomBytes(4).toString('hex')}`
}

export function calculateReadTime(content) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
}
