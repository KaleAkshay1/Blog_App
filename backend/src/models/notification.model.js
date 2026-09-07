import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    type: { type: String, enum: ['like', 'comment', 'reply', 'share'], required: true },
    eventKey: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
)

notificationSchema.index({ recipient: 1, eventKey: 1 }, { unique: true })
notificationSchema.index({ recipient: 1, createdAt: -1, _id: -1 })

export const Notification = mongoose.model('Notification', notificationSchema)
