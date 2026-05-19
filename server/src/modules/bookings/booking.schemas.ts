import { z } from 'zod'

export const createBookingSchema = z.object({
  roomId: z.number().int().positive(),
  startDatetime: z.iso.datetime(),
  endDatetime: z.iso.datetime(),
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
})
