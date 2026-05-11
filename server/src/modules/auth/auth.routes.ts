import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import { loginSchema, registerSchema } from './auth.schemas'
import { getCurrentUser, loginUser, registerUser } from './auth.service'

const authRouter = Router()

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body)
    const payload = await registerUser(input)
    res.status(201).json(payload)
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body)
    const payload = await loginUser(input.email, input.password)
    res.json(payload)
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentUser = await getCurrentUser((req as AuthenticatedRequest).user!.userId)
    res.json(currentUser)
  }),
)

export { authRouter }
