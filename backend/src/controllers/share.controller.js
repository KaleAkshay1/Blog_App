import { User } from '../models/user.model.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { requirePublishedPost } from '../utils/engagement.js'
import { createNotifications } from '../services/notification.service.js'
import { shareSchema } from '../validators/social.validator.js'

export const sharePost = asyncHandler(async (req, res) => {
  const { email } = shareSchema.parse(req.body)
  await requirePublishedPost(req.params.id)
  const recipient = await User.findOne({ email }).select('_id')
  if (!recipient)
    throw new ApiError(
      404,
      'No account was found for that email. You can copy the story link instead.',
    )
  if (recipient.id === req.user.id)
    throw new ApiError(400, 'Choose someone else to share this story with.')
  await createNotifications({
    type: 'share',
    actor: req.user._id,
    post: req.params.id,
    recipients: [recipient._id],
  })
  await requirePublishedPost(req.params.id)
  return res.status(200).json(new ApiResponse(200, null, 'This story is in their notifications.'))
})
