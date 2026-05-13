import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import { createBookingSchema } from './booking.schemas'
import { createBooking, listAllBookings, listOwnerBookings, listUserBookings } from './booking.service'

const bookingRouter = Router()

bookingRouter.use(requireAuth)

bookingRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const authUser = (req as AuthenticatedRequest).user!
    const scope = String(req.query.scope ?? 'me')

    const bookings =
      scope === 'owner' && authUser.role === 'hotel_owner'
        ? await listOwnerBookings(authUser.userId)
        : scope === 'all' && authUser.role === 'admin'
          ? await listAllBookings()
          : await listUserBookings(authUser.userId)

    res.json(bookings)
  }),
)

bookingRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createBookingSchema.parse(req.body)
    const booking = await createBooking((req as AuthenticatedRequest).user!.userId, {
      roomId: input.roomId,
      startDatetime: new Date(input.startDatetime),
      endDatetime: new Date(input.endDatetime),
    })
    res.status(201).json(booking)
  }),
)

export { bookingRouter }
