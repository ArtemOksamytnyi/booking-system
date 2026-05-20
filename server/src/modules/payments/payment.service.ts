import { BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import type { AuthenticatedUser } from '../../types/auth'
import { HttpError } from '../../utils/http'
import { syncBookingPaymentAutomation } from '../bookings/booking.service'

export const createPayment = async (actor: AuthenticatedUser, input: {
  bookingId: number
  amount: number
  paymentMethod: keyof typeof PaymentMethod
}) => {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      room: {
        include: {
          property: true,
        },
      },
      payments: true,
    },
  })

  if (!booking) {
    throw new HttpError(404, 'Booking not found')
  }

  const isRenter = booking.renterId === actor.userId
  const isAdmin = actor.role === 'admin'

  if (!isRenter && !isAdmin) {
    throw new HttpError(403, 'You do not have access to this booking payments')
  }

  if (booking.bookingStatus === BookingStatus.CANCELLED) {
    throw new HttpError(400, 'Cancelled bookings cannot receive additional payments')
  }

  const totalPaidBefore = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const totalPrice = Number(booking.totalPrice)
  const remainingAmount = Math.max(totalPrice - totalPaidBefore, 0)

  if (remainingAmount <= 0) {
    throw new HttpError(400, 'This booking is already fully paid')
  }

  if (input.amount > remainingAmount) {
    throw new HttpError(400, `Payment amount cannot exceed remaining balance of ${remainingAmount}`)
  }

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: input.amount,
      paymentMethod: PaymentMethod[input.paymentMethod],
      paymentStatus: PaymentStatus.PAID,
    },
  })

  const paidAmount = await prisma.payment.aggregate({
    where: { bookingId: booking.id },
    _sum: { amount: true },
  })

  const totalPaid = Number(paidAmount._sum.amount ?? 0)
  const paymentStatus = totalPaid >= totalPrice ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus,
    },
  })

  if (paymentStatus === PaymentStatus.PAID) {
    await prisma.reminder.deleteMany({
      where: {
        bookingId: booking.id,
        remindAt: new Date(booking.startDatetime.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    })
  }

  await syncBookingPaymentAutomation()

  return payment
}
