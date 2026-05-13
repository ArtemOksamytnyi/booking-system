import { apiFetch } from './client'
import type { AuthRole } from '../context/AuthContext'

type ApiUser = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  age?: number | null
  createdAt: string
  role: {
    name: AuthRole
  }
}

export type AdminUserDto = {
  id: string
  name: string
  email: string
  role: AuthRole
  phone: string
  age?: number | null
  createdAt: string
}

const mapUser = (user: ApiUser): AdminUserDto => ({
  id: String(user.id),
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  role: user.role.name,
  phone: user.phone,
  age: user.age,
  createdAt: user.createdAt,
})

export const getUsers = async () => {
  const users = await apiFetch<ApiUser[]>('/users')
  return users.map(mapUser)
}
