import mongoose from 'mongoose'
import { CATEGORIES } from '../constants/categories.js'

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true, maxlength: 320 },
    content: { type: String, required: true, maxlength: 50000 },
    coverImage: { type: String, default: '' },
    category: { type: String, enum: CATEGORIES, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    featured: { type: Boolean, default: false },
    readTime: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

postSchema.index({ status: 1, publishedAt: -1 })
postSchema.index({ author: 1, createdAt: -1 })

export const Post = mongoose.model('Post', postSchema)
