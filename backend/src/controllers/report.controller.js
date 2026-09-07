import { Report } from '../models/report.model.js'
import { requirePublishedPost } from '../utils/engagement.js'
import { reportSchema } from '../validators/social.validator.js'

export async function reportPost(req, res) {
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
  res.json({ message: 'Your report has been recorded. Thank you for letting us know.' })
}
