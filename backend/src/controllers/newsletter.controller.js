import { Subscriber } from '../models/subscriber.model.js'
import { newsletterSchema } from '../validators/newsletter.validator.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

export const subscribe = asyncHandler(async (req, res) => {
  const { email } = newsletterSchema.parse(req.body)
  await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true })
  return res
    .status(201)
    .json(new ApiResponse(201, null, "You're on the list. Thanks for being here!"))
})
