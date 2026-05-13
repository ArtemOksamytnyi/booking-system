import { Router } from 'express'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import { createVerificationRequestSchema, reviewVerificationSchema } from './verification.schemas'
import {
  createVerificationRequest,
  listVerificationRequests,
  listOwnerVerificationRequests,
  reviewVerificationRequest,
} from './verification.service'

const verificationRouter = Router()

verificationRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = (req as AuthenticatedRequest).user!
    const requests =
      authUser.role === 'admin'
        ? await listVerificationRequests()
        : await listOwnerVerificationRequests(authUser.userId)

    res.json(requests)
  }),
)

verificationRouter.post(
  '/',
  requireAuth,
  requireRole(['hotel_owner']),
  asyncHandler(async (req, res) => {
    const input = createVerificationRequestSchema.parse(req.body)
    const request = await createVerificationRequest((req as AuthenticatedRequest).user!.userId, input)
    res.status(201).json(request)
  }),
)

verificationRouter.patch(
  '/:id/review',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const input = reviewVerificationSchema.parse(req.body)
    const result = await reviewVerificationRequest(
      (req as AuthenticatedRequest).user!.userId,
      Number(req.params.id),
      input,
    )
    res.json(result)
  }),
)

export { verificationRouter }
