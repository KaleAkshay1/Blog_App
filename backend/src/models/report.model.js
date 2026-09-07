import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'misinformation', 'copyright', 'other'],
      required: true,
    },
    details: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
  },
  { timestamps: true },
)

reportSchema.index({ post: 1, reporter: 1 }, { unique: true })
reportSchema.index({ status: 1, createdAt: -1 })

export const Report = mongoose.model('Report', reportSchema)
