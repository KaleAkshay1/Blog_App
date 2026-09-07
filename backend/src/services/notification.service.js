import { Notification } from '../models/notification.model.js'
import { Post } from '../models/post.model.js'
import { logger } from '../config/logger.js'

// Event keys and a unique index make duplicate submissions safe.
export async function createNotifications({ type, actor, post, recipients, comment = null }) {
  const recipientIds = [...new Set(recipients.filter(Boolean).map(String))].filter(
    (id) => id !== String(actor),
  )
  if (!recipientIds.length) return
  if (!(await Post.exists({ _id: post, status: 'published' }))) return
  await Notification.init()
  const eventKey = [type, post, comment || actor].map(String).join(':')
  for (const recipient of recipientIds) {
    try {
      await Notification.updateOne(
        { recipient, eventKey },
        { $setOnInsert: { recipient, eventKey, actor, post, comment, type } },
        { upsert: true },
      )
    } catch (error) {
      if (error.code !== 11000) throw error
    }
  }
  // A story can become private while the notification is being written.
  if (!(await Post.exists({ _id: post, status: 'published' }))) {
    await Notification.deleteMany({ post, eventKey })
  }
}

// A successful comment/like must not look like a failed submission if delivery fails.
export async function notifyActivity(event) {
  try {
    await createNotifications(event)
  } catch (error) {
    logger.error('Could not create activity notification', {
      message: error.message,
      type: event.type,
      postId: String(event.post),
    })
  }
}
