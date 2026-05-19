import { BookingStatus, PaymentStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import type { AuthenticatedUser } from '../../types/auth'
import { calculateBookingTotals } from '../../utils/booking'
import { HttpError } from '../../utils/http'

const countNights = (start: Date, end: Date) => {
  const milliseconds = end.getTime() - start.getTime()
  const nights = Math.ceil(milliseconds / (1000 * 60 * 60 * 24))
  return Math.max(nights, 1)
}

export const syncExpiredBookings = async () =>
  prisma.booking.updateMany({
    where: {
      endDatetime: {
        lt: new Date(),
      },
      bookingStatus: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      },
    },
    data: {
      bookingStatus: BookingStatus.COMPLETED,
    },
  })

export const createBooking = async (
  renterId: number,
  input: {
    roomId: number
    startDatetime: Date
    endDatetime: Date
  },
) => {
  await syncExpiredBookings()

  if (input.endDatetime <= input.startDatetime) {
    throw new HttpError(400, 'Check-out must be later than check-in')
  }

  const room = await prisma.room.findUnique({
    where: { id: input.roomId },
    include: {
      bookings: {
        where: {
          bookingStatus: {
            not: BookingStatus.CANCELLED,
          },
          AND: [
            { startDatetime: { lt: input.endDatetime } },
            { endDatetime: { gt: input.startDatetime } },
          ],
        },
      },
    },
  })

  if (!room || !room.isActive) {
    throw new HttpError(404, 'Room not found or inactive')
  }

  if (room.bookings.length > 0) {
    throw new HttpError(409, 'Room is not available for the selected dates')
  }

  const nights = countNights(input.startDatetime, input.endDatetime)
  const totals = calculateBookingTotals(Number(room.pricePerUnit), nights)

  return prisma.booking.create({
    data: {
      roomId: room.id,
      renterId,
      startDatetime: input.startDatetime,
      endDatetime: input.endDatetime,
      totalPrice: totals.totalPrice,
      serviceFee: totals.serviceFee,
      ownerIncome: totals.ownerIncome,
      bookingStatus: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      reminders: {
        create: {
          userId: renterId,
          remindAt: new Date(input.endDatetime.getTime() - 24 * 60 * 60 * 1000),
          isSent: false,
        },
      },
    },
    include: {
      room: {
        include: {
          property: true,
        },
      },
      reminders: true,
    },
  })
}

export const listUserBookings = async (userId: number) => {
  await syncExpiredBookings()

  return prisma.booking.findMany({
    where: { renterId: userId },
    include: {
      room: {
        include: {
          property: true,
        },
      },
      payments: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const listOwnerBookings = async (ownerId: number) => {
  await syncExpiredBookings()

  return prisma.booking.findMany({
    where: {
      room: {
        property: {
          ownerId,
        },
      },
    },
    include: {
      room: {
        include: {
          property: true,
        },
      },
      renter: {
        include: {
          role: true,
        },
      },
      payments: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const listAllBookings = async () => {
  await syncExpiredBookings()

  return prisma.booking.findMany({
    include: {
      room: {
        include: {
          property: true,
        },
      },
      renter: {
        include: {
          role: true,
        },
      },
      payments: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const updateBookingStatus = async (
  actor: AuthenticatedUser,
  bookingId: number,
  status: 'CONFIRMED' | 'CANCELLED',
) => {
  await syncExpiredBookings()

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: {
        include: {
          property: true,
        },
      },
      renter: true,
    },
  })

  if (!booking) {
    throw new HttpError(404, 'Booking not found')
  }

  const isOwner = booking.room.property.ownerId === actor.userId
  const isRenter = booking.renterId === actor.userId
  const isAdmin = actor.role === 'admin'

  if (!isOwner && !isRenter && !isAdmin) {
    throw new HttpError(403, 'You do not have access to this booking')
  }

  if (status === 'CONFIRMED' && !isOwner && !isAdmin) {
    throw new HttpError(403, 'Only owner or admin can confirm a booking')
  }

  if (status === 'CANCELLED' && booking.bookingStatus === BookingStatus.COMPLETED) {
    throw new HttpError(400, 'Completed bookings cannot be cancelled')
  }

  return prisma.booking.update({
    where: { id: booking.id },
    data: {
      bookingStatus: BookingStatus[status],
      ...(status === 'CANCELLED' && booking.paymentStatus === PaymentStatus.PAID
        ? {
            paymentStatus: PaymentStatus.REFUNDED,
          }
        : {}),
    },
    include: {
      room: {
        include: {
          property: true,
        },
      },
      renter: {
        include: {
          role: true,
        },
      },
      payments: true,
    },
  })
}
