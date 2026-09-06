import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: '' },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
