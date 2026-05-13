import { prisma } from '../../lib/prisma'

export const listUsers = async () =>
  prisma.user.findMany({
    include: {
      role: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
