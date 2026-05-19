import { BookingStatus, VerificationStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { HttpError } from '../../utils/http'

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
    },
  })

export const createPropertyForOwner = async (ownerId: number, data: {
  propertyTypeName: 'hotel' | 'villa' | 'apartment' | 'resort'
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

  const propertyType = await prisma.propertyType.findUnique({
    where: { name: data.propertyTypeName },
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
        select: {
          rating: true,
        },
      },
    },
  })

  if (!property) {
    throw new HttpError(404, 'Property not found')
  }

  return property
}

export const getAvailableRooms = async (
  propertyId: number,
  checkIn: Date,
  checkOut: Date,
  guests: number,
) => {
  const property = await getPropertyById(propertyId)

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
