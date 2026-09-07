import { User } from '../models/user.model.js'
import { AppError } from '../utils/app-error.js'
import { requirePublishedPost } from '../utils/engagement.js'
import { createNotifications } from '../services/notification.service.js'
import { shareSchema } from '../validators/social.validator.js'

export async function sharePost(req, res) {
  const { email } = shareSchema.parse(req.body)
  await requirePublishedPost(req.params.id)
  const recipient = await User.findOne({ email }).select('_id')
  if (!recipient)
    throw new AppError(
      404,
      'No account was found for that email. You can copy the story link instead.',
    )
  if (recipient.id === req.user.id)
    throw new AppError(400, 'Choose someone else to share this story with.')
  await createNotifications({
    type: 'share',
    actor: req.user._id,
    post: req.params.id,
    recipients: [recipient._id],
  })
  await requirePublishedPost(req.params.id)
  res.json({ message: 'This story is in their notifications.' })
}
