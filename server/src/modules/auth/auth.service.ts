import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { z } from 'zod'
import { env } from '../../config/env'
import { prisma } from '../../lib/prisma'
import type { JwtPayload } from '../../types/auth'
import { HttpError } from '../../utils/http'
import { registerSchema } from './auth.schemas'

type RegisterInput = z.infer<typeof registerSchema>

const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  })

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existingUser) {
    throw new HttpError(409, 'User with this email already exists')
  }

  const role = await prisma.role.findUnique({
    where: { name: input.role },
  })

  if (!role) {
    throw new HttpError(400, 'Role is not configured in the database')
  }

  const passwordHash = await bcrypt.hash(input.password, 10)

  const user = await prisma.user.create({
    data: {
      roleId: role.id,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      age: input.age,
      passwordHash,
    },
    include: {
      role: true,
    },
  })

  const token = signToken({
    userId: user.id,
    role: user.role.name as JwtPayload['role'],
    email: user.email,
  })

  return {
    token,
    user: {
      id: user.id,
      role: user.role.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      age: user.age,
      createdAt: user.createdAt,
    },
  }
}

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (!user) {
    throw new HttpError(401, 'Invalid email or password')
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)

  if (!isValidPassword) {
    throw new HttpError(401, 'Invalid email or password')
  }

  const token = signToken({
    userId: user.id,
    role: user.role.name as JwtPayload['role'],
    email: user.email,
  })

  return {
    token,
    user: {
      id: user.id,
      role: user.role.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      age: user.age,
      createdAt: user.createdAt,
    },
  }
}

export const getCurrentUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  return {
    id: user.id,
    role: user.role.name,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    age: user.age,
    createdAt: user.createdAt,
  }
}

export const updateCurrentUser = async (
  userId: number,
  input: {
    firstName: string
    lastName: string
    email: string
  },
) => {
  const emailOwner = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (emailOwner && emailOwner.id !== userId) {
    throw new HttpError(409, 'User with this email already exists')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
    },
    include: {
      role: true,
    },
  })

  const token = signToken({
    userId: user.id,
    role: user.role.name as JwtPayload['role'],
    email: user.email,
  })

  return {
    token,
    user: {
      id: user.id,
      role: user.role.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      age: user.age,
      createdAt: user.createdAt,
    },
  }
}
