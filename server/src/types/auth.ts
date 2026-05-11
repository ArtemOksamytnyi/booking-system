export type JwtPayload = {
  userId: number
  role: 'user' | 'hotel_owner' | 'admin'
  email: string
}

export type AuthenticatedUser = JwtPayload
