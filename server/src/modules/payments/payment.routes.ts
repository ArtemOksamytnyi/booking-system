import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import { createPaymentSchema } from './payment.schemas'
import { createPayment } from './payment.service'

const paymentRouter = Router()

paymentRouter.use(requireAuth)

paymentRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createPaymentSchema.parse(req.body)
    const payment = await createPayment((req as AuthenticatedRequest).user!, input)
    res.status(201).json(payment)
  }),
)

export { paymentRouter }
