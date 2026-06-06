import { VerificationStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { HttpError } from '../../utils/http'

export const listVerificationRequests = async () =>
  prisma.verificationRequest.findMany({
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      property: true,
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      requestDate: 'desc',
    },
  })

export const listOwnerVerificationRequests = async (ownerId: number) =>
  prisma.verificationRequest.findMany({
    where: {
      ownerId,
    },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      property: true,
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      requestDate: 'desc',
    },
  })

export const createVerificationRequest = async (ownerId: number, input: {
  propertyId: number
  comment?: string
}) => {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
  })

  if (!property || property.ownerId !== ownerId) {
    throw new HttpError(404, 'Property not found for current owner')
  }

  return prisma.verificationRequest.create({
    data: {
      ownerId,
      propertyId: input.propertyId,
      comment: input.comment,
    },
  })
}

export const reviewVerificationRequest = async (
  adminId: number,
  requestId: number,
  input: { status: 'APPROVED' | 'REJECTED'; comment?: string },
) => {
  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new HttpError(404, 'Verification request not found')
  }

  const status = VerificationStatus[input.status]

  return prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.verificationRequest.update({
      where: { id: requestId },
      data: {
        adminId,
        status,
        decisionDate: new Date(),
        comment: input.comment,
      },
    })

    await tx.property.update({
      where: { id: request.propertyId },
      data: {
        verificationStatus: status,
      },
    })

    return updatedRequest
  })
}
