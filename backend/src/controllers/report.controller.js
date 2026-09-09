import { Report } from '../models/report.model.js'
import { requirePublishedPost } from '../utils/engagement.js'
import { reportSchema } from '../validators/social.validator.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

export const reportPost = asyncHandler(async (req, res) => {
  const data = reportSchema.parse(req.body)
  await requirePublishedPost(req.params.id)
  await Report.init()
  const filter = { post: req.params.id, reporter: req.user._id }
  try {
    const result = await Report.updateOne(
      filter,
      { $setOnInsert: { ...filter, ...data } },
      { upsert: true },
    )
    try {
      await requirePublishedPost(req.params.id)
    } catch (error) {
      if (result.upsertedId && error.status === 404)
        await Report.deleteOne({ _id: result.upsertedId })
      throw error
    }
  } catch (error) {
    if (error.code !== 11000) throw error
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, null, 'Your report has been recorded. Thank you for letting us know.'),
    )
})
