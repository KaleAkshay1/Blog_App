import mongoose from 'mongoose'

const followSchema = new mongoose.Schema(
  {
    // The follower subscribes to the user referenced by following.
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

followSchema.index({ follower: 1, following: 1 }, { unique: true })
followSchema.index({ following: 1 })

export const Follow = mongoose.model('Follow', followSchema)
