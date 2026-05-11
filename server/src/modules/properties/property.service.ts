import { prisma } from '../../lib/prisma'
import { HttpError } from '../../utils/http'

type ListPropertiesFilters = {
  search?: string
  category?: string
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
}

const parseDate = (value: string) => new Date(`${value}T00:00:00.000Z`)

export const listProperties = async (filters: ListPropertiesFilters = {}) =>
  prisma.property.findMany({
    where: {
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
