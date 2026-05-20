import { Router } from 'express'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import { getOwnerAnalytics, listUsers } from './user.service'

const userRouter = Router()

userRouter.use(requireAuth)

userRouter.get(
  '/',
  requireRole(['admin']),
  asyncHandler(async (_req, res) => {
    const users = await listUsers()
    res.json(users)
  }),
)

userRouter.get(
  '/me/owner-analytics',
  requireRole(['hotel_owner']),
  asyncHandler(async (req, res) => {
    const analytics = await getOwnerAnalytics((req as AuthenticatedRequest).user!.userId)
    res.json(analytics)
  }),
)

export { userRouter }
