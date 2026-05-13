import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import { listUsers } from './user.service'

const userRouter = Router()

userRouter.use(requireAuth, requireRole(['admin']))

userRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await listUsers()
    res.json(users)
  }),
)

export { userRouter }
