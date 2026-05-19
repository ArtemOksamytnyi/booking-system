import bcrypt from 'bcryptjs'
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  VerificationStatus,
} from '@prisma/client'

const prisma = new PrismaClient()
const seedPassword = 'password123'

type SeedUser = {
  roleName: 'user' | 'hotel_owner' | 'admin'
  firstName: string
  lastName: string
  phone: string
  email: string
  age: number
}

type SeedProperty = {
  ownerEmail: string
  propertyTypeName: 'hotel' | 'villa' | 'apartment' | 'resort'
  name: string
  address: string
  description: string
  rating: number
  photoUrl: string
  verificationStatus: VerificationStatus
}

const ownerEmails = ['ina.owner@lankastay.com', 'devin.owner@lankastay.com', 'lena.owner@lankastay.com']
const roomTemplates = [
  { name: 'звичайна', capacity: 2, pricePerUnit: 110, isActive: true },
  { name: 'люкс', capacity: 3, pricePerUnit: 175, isActive: true },
  { name: 'супер люкс', capacity: 5, pricePerUnit: 255, isActive: true },
]
const propertyTypes = ['hotel', 'villa', 'apartment', 'resort'] as const
const paymentMethods = [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH] as const
const cities = [
  'Galle, Sri Lanka',
  'Ella, Sri Lanka',
  'Kandy, Sri Lanka',
  'Matara, Sri Lanka',
  'Negombo, Sri Lanka',
  'Trincomalee, Sri Lanka',
  'Kotte, Sri Lanka',
  'Mirissa, Sri Lanka',
  'Nuwara Eliya, Sri Lanka',
  'Bentota, Sri Lanka',
  'Jaffna, Sri Lanka',
  'Anuradhapura, Sri Lanka',
  'Hikkaduwa, Sri Lanka',
  'Sigiriya, Sri Lanka',
  'Colombo, Sri Lanka',
]
const propertyNames = [
  'Azure Retreat',
  'Sunset Palm Villa',
  'Hill Crown Ella',
  'City Nest Kotte',
  'Ocean Land Trincomalee',
  'Green Vale Suites',
  'Blue Dune Resort',
  'Lagoon Pearl Stay',
  'Skyline Harbor Hotel',
  'Golden Cliff Villa',
  'Forest Line Lodge',
  'Coral Bay Residence',
  'Tea Garden Escape',
  'Harbor Mist Rooms',
  'Moonstone Grand',
]
const photoUrls = [
  'https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
]

const users: SeedUser[] = [
  {
    roleName: 'admin',
    firstName: 'Salman',
    lastName: 'Faris',
    phone: '+94000000001',
    email: 'admin@lankastay.com',
    age: 34,
  },
  {
    roleName: 'hotel_owner',
    firstName: 'Ina',
    lastName: 'Hogan',
    phone: '+94000000002',
    email: ownerEmails[0],
    age: 31,
  },
  {
    roleName: 'hotel_owner',
    firstName: 'Devin',
    lastName: 'Harmon',
    phone: '+94000000003',
    email: ownerEmails[1],
    age: 37,
  },
  {
    roleName: 'hotel_owner',
    firstName: 'Lena',
    lastName: 'Page',
    phone: '+94000000004',
    email: ownerEmails[2],
    age: 33,
  },
  ...Array.from({ length: 11 }, (_, index) => ({
    roleName: 'user' as const,
    firstName: `Traveler${index + 1}`,
    lastName: 'Guest',
    phone: `+94000000${String(index + 5).padStart(3, '0')}`,
    email: index === 0 ? 'user@lankastay.com' : `user${index + 1}@lankastay.com`,
    age: 23 + index,
  })),
]

const properties: SeedProperty[] = Array.from({ length: 15 }, (_, index) => ({
  ownerEmail: ownerEmails[index % ownerEmails.length],
  propertyTypeName: propertyTypes[index % propertyTypes.length],
  name: propertyNames[index],
  address: cities[index],
  description: `Curated stay option ${index + 1} with strong local atmosphere and flexible room inventory.`,
  rating: Number((4 + ((index % 9) * 0.1)).toFixed(1)),
  photoUrl: photoUrls[index % photoUrls.length],
  verificationStatus:
    index < 9
      ? VerificationStatus.APPROVED
      : index < 12
        ? VerificationStatus.PENDING
        : VerificationStatus.REJECTED,
}))

async function upsertUsers(passwordHash: string) {
  const roles = await Promise.all(
    ['user', 'hotel_owner', 'admin'].map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )

  const roleMap = new Map(roles.map((role) => [role.name, role.id]))

  const createdUsers = await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          roleId: roleMap.get(user.roleName)!,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          age: user.age,
          passwordHash,
        },
        create: {
          roleId: roleMap.get(user.roleName)!,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email,
          age: user.age,
          passwordHash,
        },
      }),
    ),
  )

  return new Map(createdUsers.map((user) => [user.email, user]))
}

async function upsertPropertyTypes() {
  const created = await Promise.all(
    propertyTypes.map((name) =>
      prisma.propertyType.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )

  return new Map(created.map((type) => [type.name, type]))
}

async function upsertProperties(
  userMap: Map<string, { id: number }>,
  propertyTypeMap: Map<string, { id: number }>,
) {
  const createdProperties = []

  for (const [index, property] of properties.entries()) {
    const owner = userMap.get(property.ownerEmail)
    const propertyType = propertyTypeMap.get(property.propertyTypeName)

    if (!owner || !propertyType) {
      continue
    }

    const existingProperty = await prisma.property.findFirst({
      where: {
        name: property.name,
        ownerId: owner.id,
      },
    })

    const savedProperty = existingProperty
      ? await prisma.property.update({
          where: { id: existingProperty.id },
          data: {
            propertyTypeId: propertyType.id,
            address: property.address,
            description: property.description,
            rating: property.rating,
            photoUrl: property.photoUrl,
            verificationStatus: property.verificationStatus,
          },
        })
      : await prisma.property.create({
          data: {
            ownerId: owner.id,
            propertyTypeId: propertyType.id,
            name: property.name,
            address: property.address,
            description: property.description,
            rating: property.rating,
            photoUrl: property.photoUrl,
            verificationStatus: property.verificationStatus,
          },
        })

    createdProperties.push(savedProperty)

    for (const [roomIndex, room] of roomTemplates.entries()) {
      const roomName = room.name
      const existingRoom = await prisma.room.findFirst({
        where: {
          propertyId: savedProperty.id,
          name: roomName,
        },
      })

      const roomData = {
        capacity: room.capacity + (index % 2),
        pricePerUnit: room.pricePerUnit + index * 7 + roomIndex * 9,
        isActive: room.isActive,
      }

      if (existingRoom) {
        await prisma.room.update({
          where: { id: existingRoom.id },
          data: roomData,
        })
      } else {
        await prisma.room.create({
          data: {
            propertyId: savedProperty.id,
            name: roomName,
            ...roomData,
          },
        })
      }
    }
  }

  return createdProperties
}

async function seedVerificationRequests(
  userMap: Map<string, { id: number }>,
  propertyMap: Map<string, { id: number; verificationStatus: VerificationStatus }>,
) {
  const admin = userMap.get('admin@lankastay.com')

  for (const property of properties) {
    const owner = userMap.get(property.ownerEmail)
    const savedProperty = propertyMap.get(property.name)

    if (!owner || !savedProperty) {
      continue
    }

    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        ownerId: owner.id,
        propertyId: savedProperty.id,
      },
    })

    const data = {
      ownerId: owner.id,
      propertyId: savedProperty.id,
      adminId: savedProperty.verificationStatus === VerificationStatus.PENDING ? null : admin?.id ?? null,
      status: savedProperty.verificationStatus,
      decisionDate: savedProperty.verificationStatus === VerificationStatus.PENDING ? null : new Date('2026-05-01T10:00:00.000Z'),
      comment:
        savedProperty.verificationStatus === VerificationStatus.APPROVED
          ? 'Documents approved by admin.'
          : savedProperty.verificationStatus === VerificationStatus.REJECTED
            ? 'Ownership document requires correction.'
            : 'Waiting for admin review.',
    }

    if (existingRequest) {
      await prisma.verificationRequest.update({ where: { id: existingRequest.id }, data })
    } else {
      await prisma.verificationRequest.create({ data })
    }
  }
}

async function seedBookingsAndPayments(
  userMap: Map<string, { id: number }>,
  propertyMap: Map<string, { id: number }>,
) {
  const renterEmails = users.filter((user) => user.roleName === 'user').map((user) => user.email)
  const approvedProperties = properties.filter((property) => property.verificationStatus === VerificationStatus.APPROVED)

  for (let index = 0; index < 15; index += 1) {
    const renter = userMap.get(renterEmails[index % renterEmails.length])
    const property = propertyMap.get(approvedProperties[index % approvedProperties.length].name)

    if (!renter || !property) {
      continue
    }

    const room = await prisma.room.findFirst({
      where: {
        propertyId: property.id,
        name: roomTemplates[index % roomTemplates.length].name,
      },
    })

    if (!room) {
      continue
    }

    const startDatetime = new Date(Date.UTC(2026, 4, 1 + index * 2, 14, 0, 0))
    const endDatetime = new Date(Date.UTC(2026, 4, 3 + index * 2, 11, 0, 0))
    const bookingStatus =
      index < 5
        ? BookingStatus.COMPLETED
        : index < 10
          ? BookingStatus.CONFIRMED
          : index < 13
            ? BookingStatus.PENDING
            : BookingStatus.CANCELLED
    const paymentStatus =
      bookingStatus === BookingStatus.CANCELLED
        ? PaymentStatus.REFUNDED
        : index % 3 === 0
          ? PaymentStatus.PARTIALLY_PAID
          : PaymentStatus.PAID

    const nights = 2
    const totalPrice = Number(room.pricePerUnit) * nights
    const serviceFee = Number((totalPrice * 0.1).toFixed(2))
    const ownerIncome = Number((totalPrice - serviceFee).toFixed(2))
    const amount = paymentStatus === PaymentStatus.PARTIALLY_PAID ? Math.round(totalPrice / 2) : totalPrice

    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId: room.id,
        renterId: renter.id,
        startDatetime,
      },
    })

    const booking = existingBooking
      ? await prisma.booking.update({
          where: { id: existingBooking.id },
          data: {
            endDatetime,
            totalPrice,
            serviceFee,
            ownerIncome,
            bookingStatus,
            paymentStatus,
          },
        })
      : await prisma.booking.create({
          data: {
            roomId: room.id,
            renterId: renter.id,
            startDatetime,
            endDatetime,
            totalPrice,
            serviceFee,
            ownerIncome,
            bookingStatus,
            paymentStatus,
          },
        })

    const existingPayment = await prisma.payment.findFirst({ where: { bookingId: booking.id } })
    const paymentData = {
      amount,
      paymentMethod: paymentMethods[index % paymentMethods.length],
      paymentStatus,
    }

    if (existingPayment) {
      await prisma.payment.update({ where: { id: existingPayment.id }, data: paymentData })
    } else {
      await prisma.payment.create({ data: { bookingId: booking.id, ...paymentData } })
    }

    const existingReminder = await prisma.reminder.findFirst({
      where: {
        bookingId: booking.id,
        userId: renter.id,
      },
    })

    if (existingReminder) {
      await prisma.reminder.update({
        where: { id: existingReminder.id },
        data: {
          remindAt: new Date(endDatetime.getTime() - 24 * 60 * 60 * 1000),
          isSent: bookingStatus === BookingStatus.COMPLETED,
        },
      })
    } else {
      await prisma.reminder.create({
        data: {
          bookingId: booking.id,
          userId: renter.id,
          remindAt: new Date(endDatetime.getTime() - 24 * 60 * 60 * 1000),
          isSent: bookingStatus === BookingStatus.COMPLETED,
        },
      })
    }
  }
}

async function seedReviews(
  userMap: Map<string, { id: number }>,
  propertyMap: Map<string, { id: number }>,
) {
  const renterEmails = users.filter((user) => user.roleName === 'user').map((user) => user.email)

  for (let index = 0; index < 15; index += 1) {
    const reviewer = userMap.get(renterEmails[index % renterEmails.length])
    const property = propertyMap.get(properties[index].name)

    if (!reviewer || !property) {
      continue
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        propertyId: property.id,
        userId: reviewer.id,
      },
    })

    const reviewData = {
      rating: 3 + (index % 3),
      comment: `Demo review ${index + 1} for ${properties[index].name}.`,
    }

    if (existingReview) {
      await prisma.review.update({ where: { id: existingReview.id }, data: reviewData })
    } else {
      await prisma.review.create({ data: { propertyId: property.id, userId: reviewer.id, ...reviewData } })
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 10)
  const userMap = await upsertUsers(passwordHash)
  const propertyTypeMap = await upsertPropertyTypes()
  const createdProperties = await upsertProperties(userMap, propertyTypeMap)
  const propertyMap = new Map(createdProperties.map((property) => [property.name, property]))

  await seedVerificationRequests(userMap, propertyMap)
  await seedBookingsAndPayments(userMap, propertyMap)
  await seedReviews(userMap, propertyMap)

  console.log('Seed completed successfully.')
  console.log('admin@lankastay.com / password123')
  console.log('user@lankastay.com / password123')
  console.log('ina.owner@lankastay.com / password123')
  console.log('devin.owner@lankastay.com / password123')
  console.log('lena.owner@lankastay.com / password123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
