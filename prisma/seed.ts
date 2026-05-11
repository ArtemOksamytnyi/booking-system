import bcrypt from 'bcryptjs'
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  VerificationStatus,
} from '@prisma/client'

const prisma = new PrismaClient()

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
  rooms: Array<{
    name: string
    capacity: number
    pricePerUnit: number
    isActive: boolean
  }>
}

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
    roleName: 'user',
    firstName: 'John',
    lastName: 'Wick',
    phone: '+94000000002',
    email: 'user@lankastay.com',
    age: 29,
  },
  {
    roleName: 'hotel_owner',
    firstName: 'Ina',
    lastName: 'Hogan',
    phone: '+94000000003',
    email: 'ina.owner@lankastay.com',
    age: 31,
  },
  {
    roleName: 'hotel_owner',
    firstName: 'Devin',
    lastName: 'Harmon',
    phone: '+94000000004',
    email: 'devin.owner@lankastay.com',
    age: 37,
  },
  {
    roleName: 'hotel_owner',
    firstName: 'Lena',
    lastName: 'Page',
    phone: '+94000000005',
    email: 'lena.owner@lankastay.com',
    age: 33,
  },
]

const properties: SeedProperty[] = [
  {
    ownerEmail: 'ina.owner@lankastay.com',
    propertyTypeName: 'resort',
    name: 'Azure Retreat',
    address: 'Matara, Sri Lanka',
    description: 'Ocean-facing premium retreat with curated family and couple experiences.',
    rating: 4.9,
    photoUrl:
      'https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?auto=format&fit=crop&w=1400&q=80',
    verificationStatus: VerificationStatus.APPROVED,
    rooms: [
      { name: 'звичайна', capacity: 2, pricePerUnit: 180, isActive: true },
      { name: 'люкс', capacity: 3, pricePerUnit: 230, isActive: true },
      { name: 'супер люкс', capacity: 5, pricePerUnit: 320, isActive: true },
    ],
  },
  {
    ownerEmail: 'ina.owner@lankastay.com',
    propertyTypeName: 'villa',
    name: 'Sunset Palm Villa',
    address: 'Galle, Sri Lanka',
    description: 'A private villa near the coast with a quiet pool and palm garden.',
    rating: 4.7,
    photoUrl:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
    verificationStatus: VerificationStatus.APPROVED,
    rooms: [
      { name: 'звичайна', capacity: 2, pricePerUnit: 120, isActive: true },
      { name: 'люкс', capacity: 4, pricePerUnit: 175, isActive: true },
      { name: 'супер люкс', capacity: 6, pricePerUnit: 260, isActive: true },
    ],
  },
  {
    ownerEmail: 'devin.owner@lankastay.com',
    propertyTypeName: 'hotel',
    name: 'Hill Crown Ella',
    address: 'Ella, Sri Lanka',
    description: 'Mountain hotel with valley views and guided hiking tours.',
    rating: 4.8,
    photoUrl:
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=80',
    verificationStatus: VerificationStatus.APPROVED,
    rooms: [
      { name: 'звичайна', capacity: 2, pricePerUnit: 115, isActive: true },
      { name: 'люкс', capacity: 3, pricePerUnit: 155, isActive: true },
      { name: 'супер люкс', capacity: 5, pricePerUnit: 210, isActive: true },
    ],
  },
  {
    ownerEmail: 'devin.owner@lankastay.com',
    propertyTypeName: 'apartment',
    name: 'City Nest Kotte',
    address: 'Kotte, Sri Lanka',
    description: 'Short-stay city property focused on business and transit comfort.',
    rating: 4.3,
    photoUrl:
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1400&q=80',
    verificationStatus: VerificationStatus.PENDING,
    rooms: [
      { name: 'звичайна', capacity: 2, pricePerUnit: 90, isActive: true },
      { name: 'люкс', capacity: 3, pricePerUnit: 135, isActive: true },
      { name: 'супер люкс', capacity: 4, pricePerUnit: 185, isActive: true },
    ],
  },
  {
    ownerEmail: 'lena.owner@lankastay.com',
    propertyTypeName: 'hotel',
    name: 'Ocean Land Trincomalee',
    address: 'Trincomalee, Sri Lanka',
    description: 'Beachfront hotel with private decks and family-friendly rooms.',
    rating: 4.6,
    photoUrl:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
    verificationStatus: VerificationStatus.REJECTED,
    rooms: [
      { name: 'звичайна', capacity: 2, pricePerUnit: 132, isActive: true },
      { name: 'люкс', capacity: 3, pricePerUnit: 182, isActive: true },
      { name: 'супер люкс', capacity: 5, pricePerUnit: 245, isActive: true },
    ],
  },
]

const seedPassword = 'password123'

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
  const propertyTypes = await Promise.all(
    ['hotel', 'villa', 'apartment', 'resort'].map((name) =>
      prisma.propertyType.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )

  return new Map(propertyTypes.map((propertyType) => [propertyType.name, propertyType]))
}

async function upsertProperties(
  userMap: Map<string, { id: number }>,
  propertyTypeMap: Map<string, { id: number }>,
) {
  const createdProperties = []

  for (const property of properties) {
    const owner = userMap.get(property.ownerEmail)
    const propertyType = propertyTypeMap.get(property.propertyTypeName)

    if (!owner || !propertyType) {
      continue
    }

    const existingProperty = await prisma.property.findFirst({
      where: {
        name: property.name,
        address: property.address,
      },
    })

    const savedProperty = existingProperty
      ? await prisma.property.update({
          where: { id: existingProperty.id },
          data: {
            ownerId: owner.id,
            propertyTypeId: propertyType.id,
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

    for (const room of property.rooms) {
      const existingRoom = await prisma.room.findFirst({
        where: {
          propertyId: savedProperty.id,
          name: room.name,
        },
      })

      if (existingRoom) {
        await prisma.room.update({
          where: { id: existingRoom.id },
          data: {
            capacity: room.capacity,
            pricePerUnit: room.pricePerUnit,
            isActive: room.isActive,
          },
        })
      } else {
        await prisma.room.create({
          data: {
            propertyId: savedProperty.id,
            name: room.name,
            capacity: room.capacity,
            pricePerUnit: room.pricePerUnit,
            isActive: room.isActive,
          },
        })
      }
    }
  }

  return createdProperties
}

async function seedVerificationRequests(
  userMap: Map<string, { id: number }>,
  propertyMap: Map<string, { id: number }>,
) {
  const admin = userMap.get('admin@lankastay.com')
  const verificationScenarios = [
    {
      ownerEmail: 'ina.owner@lankastay.com',
      propertyName: 'Azure Retreat',
      status: VerificationStatus.APPROVED,
      comment: 'Ownership documents validated successfully.',
    },
    {
      ownerEmail: 'devin.owner@lankastay.com',
      propertyName: 'City Nest Kotte',
      status: VerificationStatus.PENDING,
      comment: 'Waiting for additional property proof.',
    },
    {
      ownerEmail: 'lena.owner@lankastay.com',
      propertyName: 'Ocean Land Trincomalee',
      status: VerificationStatus.REJECTED,
      comment: 'The uploaded documents do not match the property record.',
    },
  ]

  for (const scenario of verificationScenarios) {
    const owner = userMap.get(scenario.ownerEmail)
    const property = propertyMap.get(scenario.propertyName)

    if (!owner || !property) {
      continue
    }

    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        ownerId: owner.id,
        propertyId: property.id,
      },
    })

    const data = {
      ownerId: owner.id,
      propertyId: property.id,
      adminId: scenario.status === VerificationStatus.PENDING ? null : admin?.id ?? null,
      status: scenario.status,
      decisionDate: scenario.status === VerificationStatus.PENDING ? null : new Date(),
      comment: scenario.comment,
    }

    if (existingRequest) {
      await prisma.verificationRequest.update({
        where: { id: existingRequest.id },
        data,
      })
    } else {
      await prisma.verificationRequest.create({ data })
    }
  }
}

async function seedBookingsAndPayments(
  userMap: Map<string, { id: number }>,
  propertyMap: Map<string, { id: number }>,
) {
  const renter = userMap.get('user@lankastay.com')
  if (!renter) {
    return
  }

  const bookingScenarios = [
    {
      propertyName: 'Azure Retreat',
      roomName: 'люкс',
      startDatetime: new Date('2026-05-20T14:00:00.000Z'),
      endDatetime: new Date('2026-05-23T11:00:00.000Z'),
      bookingStatus: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
      paidAmount: 345,
    },
    {
      propertyName: 'Hill Crown Ella',
      roomName: 'звичайна',
      startDatetime: new Date('2026-06-10T14:00:00.000Z'),
      endDatetime: new Date('2026-06-13T11:00:00.000Z'),
      bookingStatus: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paidAmount: 0,
    },
    {
      propertyName: 'Sunset Palm Villa',
      roomName: 'супер люкс',
      startDatetime: new Date('2026-07-01T14:00:00.000Z'),
      endDatetime: new Date('2026-07-05T11:00:00.000Z'),
      bookingStatus: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paidAmount: 1040,
    },
  ]

  for (const scenario of bookingScenarios) {
    const property = propertyMap.get(scenario.propertyName)
    if (!property) {
      continue
    }

    const room = await prisma.room.findFirst({
      where: {
        propertyId: property.id,
        name: scenario.roomName,
      },
    })

    if (!room) {
      continue
    }

    const nights = Math.max(
      1,
      Math.ceil((scenario.endDatetime.getTime() - scenario.startDatetime.getTime()) / (1000 * 60 * 60 * 24)),
    )
    const totalPrice = Number(room.pricePerUnit) * nights
    const serviceFee = Number((totalPrice * 0.1).toFixed(2))
    const ownerIncome = Number((totalPrice - serviceFee).toFixed(2))

    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId: room.id,
        renterId: renter.id,
        startDatetime: scenario.startDatetime,
      },
    })

    const booking = existingBooking
      ? await prisma.booking.update({
          where: { id: existingBooking.id },
          data: {
            endDatetime: scenario.endDatetime,
            totalPrice,
            serviceFee,
            ownerIncome,
            bookingStatus: scenario.bookingStatus,
            paymentStatus: scenario.paymentStatus,
          },
        })
      : await prisma.booking.create({
          data: {
            roomId: room.id,
            renterId: renter.id,
            startDatetime: scenario.startDatetime,
            endDatetime: scenario.endDatetime,
            totalPrice,
            serviceFee,
            ownerIncome,
            bookingStatus: scenario.bookingStatus,
            paymentStatus: scenario.paymentStatus,
          },
        })

    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
      },
    })

    if (scenario.paidAmount > 0) {
      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: scenario.paidAmount,
            paymentMethod: PaymentMethod.CARD,
            paymentStatus: scenario.paymentStatus,
          },
        })
      } else {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: scenario.paidAmount,
            paymentMethod: PaymentMethod.CARD,
            paymentStatus: scenario.paymentStatus,
          },
        })
      }
    }

    const existingReminder = await prisma.reminder.findFirst({
      where: {
        bookingId: booking.id,
        userId: renter.id,
      },
    })

    if (!existingReminder) {
      await prisma.reminder.create({
        data: {
          bookingId: booking.id,
          userId: renter.id,
          remindAt: new Date(scenario.startDatetime.getTime() - 24 * 60 * 60 * 1000),
          isSent: scenario.bookingStatus === BookingStatus.COMPLETED,
        },
      })
    }
  }
}

async function seedReviews(userMap: Map<string, { id: number }>, propertyMap: Map<string, { id: number }>) {
  const renter = userMap.get('user@lankastay.com')
  if (!renter) {
    return
  }

  const reviewScenarios = [
    {
      propertyName: 'Azure Retreat',
      rating: 5,
      comment: 'Amazing stay, very smooth check-in and excellent service.',
    },
    {
      propertyName: 'Sunset Palm Villa',
      rating: 4,
      comment: 'Beautiful place with great privacy and nice rooms.',
    },
    {
      propertyName: 'Hill Crown Ella',
      rating: 5,
      comment: 'Perfect mountain view and very friendly staff.',
    },
  ]

  for (const scenario of reviewScenarios) {
    const property = propertyMap.get(scenario.propertyName)
    if (!property) {
      continue
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        propertyId: property.id,
        userId: renter.id,
      },
    })

    if (existingReview) {
      await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: scenario.rating,
          comment: scenario.comment,
        },
      })
    } else {
      await prisma.review.create({
        data: {
          propertyId: property.id,
          userId: renter.id,
          rating: scenario.rating,
          comment: scenario.comment,
        },
      })
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
  console.log('Users:')
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
