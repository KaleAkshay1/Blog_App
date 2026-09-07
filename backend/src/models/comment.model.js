import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true, maxlength: 2000, default: '' },
    // Replies share a top-level parent, keeping long conversations readable.
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    isDeleted: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

commentSchema.index({ post: 1, parent: 1, createdAt: -1, _id: -1 })
commentSchema.index({ post: 1, isDeleted: 1 })

export const Comment = mongoose.model('Comment', commentSchema)
