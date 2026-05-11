import { z } from 'zod'

export const createPaymentSchema = z.object({
  bookingId: z.number().int().positive(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'CASH']),
})
