import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import { listUserReminders } from './reminder.service'

const reminderRouter = Router()

reminderRouter.use(requireAuth)

reminderRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const reminders = await listUserReminders((req as AuthenticatedRequest).user!.userId)
    res.json(reminders)
  }),
)

export { reminderRouter }
