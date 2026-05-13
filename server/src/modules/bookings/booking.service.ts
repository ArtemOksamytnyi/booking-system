import { PaymentStatus, BookingStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { calculateBookingTotals } from '../../utils/booking'
import { HttpError } from '../../utils/http'

const countNights = (start: Date, end: Date) => {
  const milliseconds = end.getTime() - start.getTime()
  const nights = Math.ceil(milliseconds / (1000 * 60 * 60 * 24))
  return Math.max(nights, 1)
}

export const createBooking = async (renterId: number, input: {
  roomId: number
  startDatetime: Date
  endDatetime: Date
}) => {
  if (input.endDatetime <= input.startDatetime) {
    throw new HttpError(400, 'Check-out must be later than check-in')
  }

  const room = await prisma.room.findUnique({
    where: { id: input.roomId },
    include: {
      bookings: {
        where: {
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
    },
    include: {
      room: {
        include: {
          property: true,
        },
      },
    },
  })
}

export const listUserBookings = async (userId: number) =>
  prisma.booking.findMany({
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

export const listOwnerBookings = async (ownerId: number) =>
  prisma.booking.findMany({
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

export const listAllBookings = async () =>
  prisma.booking.findMany({
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
