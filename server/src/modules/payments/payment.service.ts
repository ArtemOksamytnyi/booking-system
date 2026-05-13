import { BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { HttpError } from '../../utils/http'

export const createPayment = async (input: {
  bookingId: number
  amount: number
  paymentMethod: keyof typeof PaymentMethod
}) => {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
  })

  if (!booking) {
    throw new HttpError(404, 'Booking not found')
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
  const totalPrice = Number(booking.totalPrice)
  const paymentStatus = totalPaid >= totalPrice ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus,
      bookingStatus:
        paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.PARTIALLY_PAID
          ? BookingStatus.CONFIRMED
          : booking.bookingStatus,
    },
  })

  return payment
}
