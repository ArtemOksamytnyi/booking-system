import { prisma } from '../../lib/prisma'

export const listTopOwners = async (minimumIncome = 1000) => {
  const allOwnerStats = await prisma.user.findMany({
    where: {
      role: {
        name: 'hotel_owner',
      },
    },
    include: {
      ownedProperties: {
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
          rooms: {
            include: {
              bookings: {
                where: {
                  bookingStatus: {
                    in: ['CONFIRMED', 'COMPLETED'],
                  },
                  paymentStatus: {
                    in: ['PARTIALLY_PAID', 'PAID'],
                  },
                },
                select: {
                  ownerIncome: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return allOwnerStats
    .map((owner) => {
      const totalIncome = owner.ownedProperties.reduce(
        (sum, property) =>
          sum +
          property.rooms.reduce(
            (roomSum, room) =>
              roomSum +
              room.bookings.reduce(
                (bookingSum, booking) => bookingSum + Number(booking.ownerIncome),
                0,
              ),
            0,
          ),
        0,
      )
      const ratings = owner.ownedProperties.flatMap((property) =>
        property.reviews.map((review) => review.rating),
      )
      const averageRating = ratings.length
        ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2))
        : 0

      return {
        ownerId: owner.id,
        name: `${owner.firstName} ${owner.lastName}`.trim(),
        totalIncome,
        averageRating,
      }
    })
    .filter((owner) => owner.totalIncome > minimumIncome)
    .sort((left, right) => {
      if (right.totalIncome !== left.totalIncome) {
        return right.totalIncome - left.totalIncome
      }

      return right.averageRating - left.averageRating
    })
}

export const listUsers = async () =>
  prisma.user.findMany({
    include: {
      role: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

export const getOwnerAnalytics = async (ownerId: number) => {
  const properties = await prisma.property.findMany({
    where: {
      ownerId,
    },
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  })

  const bookings = await prisma.booking.findMany({
    where: {
      room: {
        property: {
          ownerId,
        },
      },
      bookingStatus: {
        in: ['CONFIRMED', 'COMPLETED'],
      },
      paymentStatus: {
        in: ['PARTIALLY_PAID', 'PAID'],
      },
    },
    select: {
      ownerIncome: true,
    },
  })

  const topOwners = await listTopOwners()

  const ownerRatings = properties.flatMap((property) => property.reviews.map((review) => review.rating))
  const totalIncome = bookings.reduce((sum, booking) => sum + Number(booking.ownerIncome), 0)
  const averageRating = ownerRatings.length
    ? Number((ownerRatings.reduce((sum, rating) => sum + rating, 0) / ownerRatings.length).toFixed(2))
    : 0

  return {
    totalIncome,
    averageRating,
    topOwners,
    isSuperHost: topOwners[0]?.ownerId === ownerId,
  }
}
