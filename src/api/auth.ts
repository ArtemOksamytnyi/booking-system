import { apiFetch } from './client'
import type { AuthRole } from '../context/AuthContext'

type ApiAuthUser = {
  id: number
  role: AuthRole
  firstName: string
  lastName: string
  phone: string
  email: string
  age?: number | null
  createdAt: string
}

type ApiAuthPayload = {
  token: string
  user: ApiAuthUser
}

export type AuthUserDto = {
  id: string
  name: string
  email: string
  role: AuthRole
  phone: string
  age?: number | null
  documents: string[]
  verificationStatus: 'verified' | 'pending' | 'rejected'
}

const toVerificationStatus = (role: AuthRole): AuthUserDto['verificationStatus'] =>
  role === 'hotel_owner' ? 'pending' : 'verified'

export const mapApiUserToAuthUser = (user: ApiAuthUser): AuthUserDto => ({
  id: String(user.id),
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  role: user.role,
  phone: user.phone,
  age: user.age,
  documents: [],
  verificationStatus: toVerificationStatus(user.role),
})

export const loginRequest = async (email: string, password: string) => {
  const payload = await apiFetch<ApiAuthPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return {
    token: payload.token,
    user: mapApiUserToAuthUser(payload.user),
  }
}

export const registerRequest = async (input: {
  name: string
  email: string
  password: string
  role: AuthRole
  phone: string
  age?: number
}) => {
  const [firstName, ...rest] = input.name.trim().split(/\s+/)
  const lastName = rest.join(' ') || firstName

  const payload = await apiFetch<ApiAuthPayload>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: input.role,
      firstName,
      lastName,
      phone: input.phone,
      email: input.email,
      age: input.age,
      password: input.password,
    }),
  })

  return {
    token: payload.token,
    user: mapApiUserToAuthUser(payload.user),
  }
}

export const meRequest = async () => {
  const user = await apiFetch<ApiAuthUser>('/auth/me')
  return mapApiUserToAuthUser(user)
}

export const updateProfileRequest = async (input: { name: string; email: string }) => {
  const [firstName, ...rest] = input.name.trim().split(/\s+/)
  const lastName = rest.join(' ') || firstName

  const payload = await apiFetch<ApiAuthPayload>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({
      firstName,
      lastName,
      email: input.email,
    }),
  })

  return {
    token: payload.token,
    user: mapApiUserToAuthUser(payload.user),
  }
}
