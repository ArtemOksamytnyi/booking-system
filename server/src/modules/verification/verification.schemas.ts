import { z } from 'zod'

export const createVerificationRequestSchema = z.object({
  propertyId: z.number().int().positive(),
  comment: z.string().max(2000).optional(),
})

export const reviewVerificationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().max(2000).optional(),
})
