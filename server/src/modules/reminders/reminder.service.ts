import { prisma } from '../../lib/prisma'

export const syncDueReminders = async () =>
  prisma.reminder.updateMany({
    where: {
      remindAt: {
        lte: new Date(),
      },
      isSent: false,
    },
    data: {
      isSent: true,
    },
  })

export const listUserReminders = async (userId: number) => {
  await syncDueReminders()

  return prisma.reminder.findMany({
    where: {
      userId,
    },
    include: {
      booking: {
        include: {
          room: {
            include: {
              property: true,
            },
          },
        },
      },
    },
    orderBy: {
      remindAt: 'asc',
    },
  })
}
