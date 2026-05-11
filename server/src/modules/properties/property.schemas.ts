import { z } from 'zod'

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const createPropertySchema = z.object({
  propertyTypeId: z.number().int().positive(),
  name: z.string().min(2).max(120),
  address: z.string().min(5).max(255),
  description: z.string().max(5000).optional(),
  photoUrl: z.string().url().optional(),
})

export const listPropertiesSchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  city: z.string().trim().optional(),
  checkIn: dateStringSchema.optional(),
  checkOut: dateStringSchema.optional(),
  guests: z.coerce.number().int().positive().optional(),
})

export const propertyAvailabilitySchema = z.object({
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  guests: z.coerce.number().int().positive().default(1),
})
