import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createOwnerProperty } from '../api/properties'
import { ApiError } from '../api/client'
import {
  loginRequest,
  meRequest,
  registerRequest,
  updateProfileRequest,
  type AuthUserDto,
} from '../api/auth'

export type AuthRole = 'user' | 'hotel_owner' | 'admin'

export type VerificationStatus = 'verified' | 'pending' | 'rejected'

export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected'

export type VerificationRequest = {
  id: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  propertyName: string
  propertyId?: number
  documents: string[]
  status: VerificationRequestStatus
  ownerComment: string
  adminComment: string
  createdAt: string
  reviewedAt: string | null
}

export type AuthUser = AuthUserDto

export type AuthResult = {
  ok: boolean
  message: string
}

export type RegisterPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: AuthRole
  phone: string
  age?: number
  propertyName?: string
  propertyTypeName?: string
  propertyAddress?: string
  propertyDescription?: string
  propertyPhotoUrl?: string
  verificationComment?: string
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  isHydrating: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (payload: RegisterPayload) => Promise<AuthResult>
  logout: () => void
  updateProfile: (name: string, email: string) => Promise<AuthResult>
  hydrateUser: () => Promise<void>
}

const toMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

export const getDashboardPath = (role: AuthRole) => {
  if (role === 'admin') {
    return '/admin'
  }

  if (role === 'hotel_owner') {
    return '/owner'
  }

  return '/dashboard'
}

export const humanizeRole = (role: AuthRole) => {
  if (role === 'hotel_owner') {
    return 'Hotel Owner'
  }

  return role === 'admin' ? 'Admin' : 'User'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isHydrating: false,
      login: async (email, password) => {
        try {
          const payload = await loginRequest(email.toLowerCase().trim(), password)
          set({ token: payload.token, user: payload.user })
          return { ok: true, message: `Login successful. Welcome back, ${payload.user.name}!` }
        } catch (error) {
          return { ok: false, message: toMessage(error, 'Invalid email or password.') }
        }
      },
      register: async ({
        firstName,
        lastName,
        email,
        password,
        role,
        phone,
        age,
        propertyName,
        propertyTypeName,
        propertyAddress,
        propertyDescription,
        propertyPhotoUrl,
        verificationComment,
      }) => {
        try {
          const payload = await registerRequest({
            firstName,
            lastName,
            email: email.toLowerCase().trim(),
            password,
            role,
            phone,
            age,
          })
          set({ token: payload.token, user: payload.user })

          if (role === 'hotel_owner') {
            if (!propertyName?.trim() || !propertyAddress?.trim()) {
              return {
                ok: false,
                message: 'Hotel owner registration requires hotel name and address.',
              }
            }

            await createOwnerProperty({
              name: propertyName.trim(),
              address: propertyAddress.trim(),
              description: propertyDescription?.trim() || undefined,
              photoUrl: propertyPhotoUrl?.trim() || undefined,
              propertyTypeName: propertyTypeName ?? 'hotel',
              verificationComment: verificationComment?.trim() || undefined,
            })

            return {
              ok: true,
              message: 'Registration successful. Your hotel was added and sent for verification.',
            }
          }

          return { ok: true, message: `Registration successful. Welcome, ${payload.user.name}!` }
        } catch (error) {
          return { ok: false, message: toMessage(error, 'Unable to register account.') }
        }
      },
      logout: () => {
        set({ token: null, user: null, isHydrating: false })
      },
      updateProfile: async (name, email) => {
        try {
          const payload = await updateProfileRequest({ name, email: email.toLowerCase().trim() })
          set({ token: payload.token, user: payload.user })
          return { ok: true, message: 'Profile updated successfully.' }
        } catch (error) {
          return { ok: false, message: toMessage(error, 'Unable to update profile.') }
        }
      },
      hydrateUser: async () => {
        if (!get().token) {
          return
        }

        set({ isHydrating: true })

        try {
          const user = await meRequest()
          set({ user, isHydrating: false })
        } catch {
          set({ token: null, user: null, isHydrating: false })
        }
      },
    }),
    {
      name: 'lankastay_auth_store_v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
)
