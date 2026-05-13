import { z } from 'zod'

export const registerSchema = z.object({
  role: z.enum(['user', 'hotel_owner', 'admin']),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  age: z.number().int().positive().max(120).optional(),
  password: z.string().min(8),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
})
