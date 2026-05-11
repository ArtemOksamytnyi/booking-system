import { z } from 'zod'

export const createBookingSchema = z.object({
  roomId: z.number().int().positive(),
  startDatetime: z.iso.datetime(),
  endDatetime: z.iso.datetime(),
})
