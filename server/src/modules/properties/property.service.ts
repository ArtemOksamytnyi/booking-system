import { BookingStatus, VerificationStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { HttpError } from '../../utils/http'
import { listTopOwners } from '../users/user.service'

type ListPropertiesFilters = {
  search?: string
  category?: string
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  ownerEmail?: string
}

const parseDate = (value: string) => new Date(`${value}T00:00:00.000Z`)

export const listProperties = async (filters: ListPropertiesFilters = {}) =>
  prisma.property.findMany({
    where: {
      ...(!filters.ownerEmail
        ? {
            isActive: true,
            verificationStatus: VerificationStatus.APPROVED,
          }
        : {}),
      ...(filters.ownerEmail
        ? {
            owner: {
              email: {
                equals: filters.ownerEmail,
                mode: 'insensitive',
              },
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { address: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.category && filters.category !== 'All'
        ? {
            propertyType: {
              name: {
                equals: filters.category,
                mode: 'insensitive',
              },
            },
          }
        : {}),
      ...(filters.city && filters.city !== 'All'
        ? {
            address: {
              contains: filters.city,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(filters.checkIn && filters.checkOut
        ? {
            rooms: {
              some: {
                isActive: true,
                ...(filters.guests
                  ? {
                      capacity: {
                        gte: filters.guests,
                      },
                    }
                  : {}),
                bookings: {
                  none: {
                    bookingStatus: {
                      not: BookingStatus.CANCELLED,
                    },
                    AND: [
                      {
                        startDatetime: {
                          lt: parseDate(filters.checkOut),
                        },
                      },
                      {
                        endDatetime: {
                          gt: parseDate(filters.checkIn),
                        },
                      },
                    ],
                  },
                },
              },
            },
          }
        : {}),
    },
    include: {
      propertyType: true,
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      rooms: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

export const createProperty = async (ownerId: number, data: {
  propertyTypeId: number
  name: string
  address: string
  description?: string
  photoUrl?: string
}) =>
  prisma.property.create({
    data: {
      ownerId,
      propertyTypeId: data.propertyTypeId,
      name: data.name,
      address: data.address,
      description: data.description,
      photoUrl: data.photoUrl,
      isActive: true,
    },
  })

export const createPropertyForOwner = async (ownerId: number, data: {
  propertyTypeName: string
  name: string
  address: string
  description?: string
  photoUrl?: string
}) => {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
  })

  if (!owner) {
    throw new HttpError(404, 'Owner account not found')
  }

  const propertyType = await prisma.propertyType.findFirst({
    where: {
      name: {
        equals: data.propertyTypeName.trim(),
        mode: 'insensitive',
      },
    },
  })

  if (!propertyType) {
    throw new HttpError(404, 'Property type not found')
  }

  const property = await prisma.property.create({
    data: {
      ownerId: owner.id,
      propertyTypeId: propertyType.id,
      name: data.name,
      address: data.address,
      description: data.description,
      photoUrl: data.photoUrl,
      isActive: true,
      verificationStatus: VerificationStatus.PENDING,
    },
    include: {
      propertyType: true,
      rooms: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  })

  return property
}

export const listPropertyTypes = async () =>
  prisma.propertyType.findMany({
    orderBy: {
      name: 'asc',
    },
  })

export const listSuperHostProperties = async () => {
  const topOwners = await listTopOwners()
  const topOwnerIds = topOwners.map((owner) => owner.ownerId)

  if (topOwnerIds.length === 0) {
    return []
  }

  return prisma.property.findMany({
    where: {
      ownerId: {
        in: topOwnerIds,
      },
      isActive: true,
      verificationStatus: VerificationStatus.APPROVED,
    },
    include: {
      propertyType: true,
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      rooms: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: {
      rating: 'desc',
    },
  })
}

export const createRoomForOwner = async (
  propertyId: number,
  actor: { userId: number; role: 'user' | 'hotel_owner' | 'admin' },
  data: {
    name: string
    capacity: number
    pricePerUnit: number
    isActive: boolean
  },
) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: true,
    },
  })

  if (!property) {
    throw new HttpError(404, 'Property not found')
  }

  if (actor.role !== 'admin' && property.ownerId !== actor.userId) {
    throw new HttpError(403, 'You do not have access to this property')
  }

  return prisma.room.create({
    data: {
      propertyId: property.id,
      name: data.name,
      capacity: data.capacity,
      pricePerUnit: data.pricePerUnit,
      isActive: data.isActive,
    },
  })
}

export const updatePropertyForOwner = async (
  propertyId: number,
  actor: { userId: number; role: 'user' | 'hotel_owner' | 'admin' },
  data: {
    propertyTypeName: string
    name: string
    address: string
    description?: string
    photoUrl?: string
  },
) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })

  if (!property) {
    throw new HttpError(404, 'Property not found')
  }

  if (actor.role !== 'admin' && property.ownerId !== actor.userId) {
    throw new HttpError(403, 'You do not have access to this property')
  }

  const propertyType = await prisma.propertyType.findFirst({
    where: {
      name: {
        equals: data.propertyTypeName.trim(),
        mode: 'insensitive',
      },
    },
  })

  if (!propertyType) {
    throw new HttpError(404, 'Property type not found')
  }

  return prisma.property.update({
    where: { id: property.id },
    data: {
      propertyTypeId: propertyType.id,
      name: data.name,
      address: data.address,
      description: data.description,
      photoUrl: data.photoUrl,
    },
  })
}

export const updateRoomForOwner = async (
  roomId: number,
  actor: { userId: number; role: 'user' | 'hotel_owner' | 'admin' },
  data: {
    name: string
    capacity: number
    pricePerUnit: number
    isActive: boolean
  },
) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      property: true,
    },
  })

  if (!room) {
    throw new HttpError(404, 'Room not found')
  }

  if (actor.role !== 'admin' && room.property.ownerId !== actor.userId) {
    throw new HttpError(403, 'You do not have access to this room')
  }

  return prisma.room.update({
    where: { id: room.id },
    data,
  })
}

const refundBookingPayments = async (bookingIds: number[]) => {
  if (bookingIds.length === 0) {
    return
  }

  await prisma.payment.updateMany({
    where: {
      bookingId: {
        in: bookingIds,
      },
    },
    data: {
      paymentStatus: 'REFUNDED',
    },
  })

  await prisma.reminder.deleteMany({
    where: {
      bookingId: {
        in: bookingIds,
      },
    },
  })

  await prisma.booking.updateMany({
    where: {
      id: {
        in: bookingIds,
      },
    },
    data: {
      bookingStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
    },
  })
}

const getRoomActiveBookings = async (roomId: number) =>
  prisma.booking.findMany({
    where: {
      roomId,
      bookingStatus: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
  })

export const removeOrDeactivateRoomForOwner = async (
  roomId: number,
  actor: { userId: number; role: 'user' | 'hotel_owner' | 'admin' },
  action: 'delete' | 'deactivate' | 'activate' | 'cancel_pending',
) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      property: true,
    },
  })

  if (!room) {
    throw new HttpError(404, 'Room not found')
  }

  if (actor.role !== 'admin' && room.property.ownerId !== actor.userId) {
    throw new HttpError(403, 'You do not have access to this room')
  }

  const activeBookings = await getRoomActiveBookings(room.id)
  const confirmedBookings = activeBookings.filter((booking) => booking.bookingStatus === 'CONFIRMED')
  const pendingBookings = activeBookings.filter((booking) => booking.bookingStatus === 'PENDING')

  if (action === 'cancel_pending') {
    await refundBookingPayments(pendingBookings.map((booking) => booking.id))

    if (confirmedBookings.length > 0) {
      return prisma.room.update({
        where: { id: room.id },
        data: {
          isActive: false,
        },
      })
    }

    return prisma.room.delete({
      where: { id: room.id },
    })
  }

  if (action === 'deactivate') {
    return prisma.room.update({
      where: { id: room.id },
      data: {
        isActive: false,
      },
    })
  }

  if (action === 'activate') {
    return prisma.room.update({
      where: { id: room.id },
      data: {
        isActive: true,
      },
    })
  }

  if (activeBookings.length > 0) {
    if (confirmedBookings.length > 0) {
      throw new HttpError(409, 'Room has confirmed bookings. Deactivate it instead.')
    }

    throw new HttpError(409, 'Room has pending bookings. Cancel pending bookings first.')
  }

  return prisma.room.delete({
    where: { id: room.id },
  })
}

export const removeOrDeactivatePropertyForOwner = async (
  propertyId: number,
  actor: { userId: number; role: 'user' | 'hotel_owner' | 'admin' },
  action: 'delete' | 'deactivate' | 'activate' | 'cancel_pending',
) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      rooms: {
        include: {
          bookings: {
            where: {
              bookingStatus: {
                in: ['PENDING', 'CONFIRMED'],
              },
            },
          },
        },
      },
    },
  })

  if (!property) {
    throw new HttpError(404, 'Property not found')
  }

  if (actor.role !== 'admin' && property.ownerId !== actor.userId) {
    throw new HttpError(403, 'You do not have access to this property')
  }

  const activeBookings = property.rooms.flatMap((room) => room.bookings)
  const confirmedBookings = activeBookings.filter((booking) => booking.bookingStatus === 'CONFIRMED')
  const pendingBookings = activeBookings.filter((booking) => booking.bookingStatus === 'PENDING')

  if (action === 'cancel_pending') {
    await refundBookingPayments(pendingBookings.map((booking) => booking.id))

    if (confirmedBookings.length > 0) {
      await prisma.room.updateMany({
        where: { propertyId: property.id },
        data: { isActive: false },
      })

      return prisma.property.update({
        where: { id: property.id },
        data: { isActive: false },
      })
    }

    return prisma.property.delete({
      where: { id: property.id },
    })
  }

  if (action === 'deactivate') {
    await prisma.room.updateMany({
      where: { propertyId: property.id },
      data: { isActive: false },
    })

    return prisma.property.update({
      where: { id: property.id },
      data: { isActive: false },
    })
  }

  if (action === 'activate') {
    await prisma.room.updateMany({
      where: { propertyId: property.id },
      data: { isActive: true },
    })

    return prisma.property.update({
      where: { id: property.id },
      data: { isActive: true },
    })
  }

  if (activeBookings.length > 0) {
    if (confirmedBookings.length > 0) {
      throw new HttpError(409, 'Property has confirmed bookings. Deactivate it instead.')
    }

    throw new HttpError(409, 'Property has pending bookings. Cancel pending bookings first.')
  }

  return prisma.property.delete({
    where: { id: property.id },
  })
}

export const reviewPropertyVerification = async (input: {
  ownerEmail: string
  propertyName: string
  propertyId?: number
  status: 'APPROVED' | 'REJECTED'
}) => {
  const property = input.propertyId
    ? await prisma.property.findFirst({
        where: {
          id: input.propertyId,
          owner: {
            email: {
              equals: input.ownerEmail.toLowerCase().trim(),
              mode: 'insensitive',
            },
          },
        },
      })
    : await prisma.property.findFirst({
        where: {
          name: input.propertyName,
          owner: {
            email: {
              equals: input.ownerEmail.toLowerCase().trim(),
              mode: 'insensitive',
            },
          },
        },
      })

  if (!property) {
    throw new HttpError(404, 'Property not found for this owner')
  }

  return prisma.property.update({
    where: { id: property.id },
    data: {
      verificationStatus: VerificationStatus[input.status],
    },
  })
}

export const getPropertyById = async (propertyId: number) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      propertyType: true,
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      rooms: {
        where: { isActive: true },
        orderBy: { pricePerUnit: 'asc' },
      },
      reviews: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!property) {
    throw new HttpError(404, 'Property not found')
  }

  return property
}

export const createPropertyReview = async (
  propertyId: number,
  userId: number,
  input: {
    rating: number
    comment?: string
  },
) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })

  if (!property) {
    throw new HttpError(404, 'Property not found')
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      propertyId,
      userId,
    },
  })

  const review = existingReview
    ? await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: input.rating,
          comment: input.comment,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    : await prisma.review.create({
        data: {
          propertyId,
          userId,
          rating: input.rating,
          comment: input.comment,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })

  const aggregate = await prisma.review.aggregate({
    where: { propertyId },
    _avg: {
      rating: true,
    },
  })

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      rating: aggregate._avg.rating ?? undefined,
    },
  })

  return review
}

export const getAvailableRooms = async (
  propertyId: number,
  checkIn: Date,
  checkOut: Date,
  guests: number,
) => {
  const property = await getPropertyById(propertyId)

  if (!property.isActive) {
    throw new HttpError(400, 'Property is inactive')
  }

  const rooms = await prisma.room.findMany({
    where: {
      propertyId,
      isActive: true,
      capacity: {
        gte: guests,
      },
      bookings: {
        none: {
          bookingStatus: {
            not: BookingStatus.CANCELLED,
          },
          AND: [
            {
              startDatetime: {
                lt: checkOut,
              },
            },
            {
              endDatetime: {
                gt: checkIn,
              },
            },
          ],
        },
      },
    },
    orderBy: {
      pricePerUnit: 'asc',
    },
  })

  return {
    property: {
      id: property.id,
      name: property.name,
      address: property.address,
      photoUrl: property.photoUrl,
    },
    rooms,
  }
}
