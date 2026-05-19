import { z } from 'zod'

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().max(5000).optional(),
)
const optionalUrlString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().url().optional(),
)

export const createPropertySchema = z.object({
  propertyTypeId: z.number().int().positive(),
  name: z.string().min(2).max(120),
  address: z.string().trim().min(2).max(255),
  description: optionalTrimmedString,
  photoUrl: optionalUrlString,
})

export const createOwnerPropertySchema = z.object({
  propertyTypeName: z.enum(['hotel', 'villa', 'apartment', 'resort']).default('hotel'),
  name: z.string().min(2).max(120),
  address: z.string().trim().min(2).max(255),
  description: optionalTrimmedString,
  photoUrl: optionalUrlString,
})

export const createRoomSchema = z.object({
  name: z.string().trim().min(2).max(100),
  capacity: z.coerce.number().int().positive(),
  pricePerUnit: z.coerce.number().positive(),
  isActive: z.boolean().default(true),
})

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(1000).optional(),
  ),
})

export const listPropertiesSchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  city: z.string().trim().optional(),
  checkIn: dateStringSchema.optional(),
  checkOut: dateStringSchema.optional(),
  guests: z.coerce.number().int().positive().optional(),
  ownerEmail: z.string().email().optional(),
})

export const propertyAvailabilitySchema = z.object({
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  guests: z.coerce.number().int().positive().default(1),
})

export const reviewPropertyVerificationSchema = z.object({
  ownerEmail: z.string().email(),
  propertyName: z.string().min(2).max(120),
  propertyId: z.number().int().positive().optional(),
  status: z.enum(['APPROVED', 'REJECTED']),
})
