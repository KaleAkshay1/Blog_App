import { Subscriber } from '../models/subscriber.model.js'
import { newsletterSchema } from '../validators/newsletter.validator.js'

export async function subscribe(req, res) {
  const { email } = newsletterSchema.parse(req.body)
  await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true })
  res.status(201).json({ message: "You're on the list. Thanks for being here!" })
}
