import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes'
import { bookingRouter } from '../modules/bookings/booking.routes'
import { paymentRouter } from '../modules/payments/payment.routes'
import { propertyRouter } from '../modules/properties/property.routes'
import { userRouter } from '../modules/users/user.routes'
import { verificationRouter } from '../modules/verification/verification.routes'

const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'lankastay-api',
    timestamp: new Date().toISOString(),
  })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/properties', propertyRouter)
apiRouter.use('/bookings', bookingRouter)
apiRouter.use('/payments', paymentRouter)
apiRouter.use('/verification-requests', verificationRouter)
apiRouter.use('/users', userRouter)

export { apiRouter }
