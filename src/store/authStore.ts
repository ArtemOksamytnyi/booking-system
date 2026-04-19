import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type AuthRole = 'user' | 'hotel_owner' | 'admin'

export type VerificationStatus = 'verified' | 'pending'

type StoredAccount = {
  id: string
  name: string
  email: string
  password: string
  role: AuthRole
  documents: string[]
  verificationStatus: VerificationStatus
}

export type AuthUser = Omit<StoredAccount, 'password'>

export type AuthResult = {
  ok: boolean
  message: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  role: AuthRole
  documents?: string[]
}

type AuthState = {
  accounts: StoredAccount[]
  user: AuthUser | null
  login: (email: string, password: string) => AuthResult
  register: (payload: RegisterPayload) => AuthResult
  logout: () => void
  updateProfile: (name: string, email: string) => AuthResult
}

const seedAccounts: StoredAccount[] = [
  {
    id: 'acc_admin_1',
    name: 'Salman Faris',
    email: 'admin@lankastay.com',
    password: 'admin123',
    role: 'admin',
    documents: [],
    verificationStatus: 'verified',
  },
  {
    id: 'acc_user_1',
    name: 'John Wick',
    email: 'user@lankastay.com',
    password: 'user123',
    role: 'user',
    documents: [],
    verificationStatus: 'verified',
  },
  {
    id: 'acc_owner_1',
    name: 'Ina Hogan',
    email: 'owner@lankastay.com',
    password: 'owner123',
    role: 'hotel_owner',
    documents: ['business-license.pdf', 'property-proof.pdf'],
    verificationStatus: 'verified',
  },
]

const toUser = (account: StoredAccount): AuthUser => ({
  id: account.id,
  name: account.name,
  email: account.email,
  role: account.role,
  documents: account.documents,
  verificationStatus: account.verificationStatus,
})

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
      accounts: seedAccounts,
      user: null,
      login: (email, password) => {
        const account = get().accounts.find(
          (item) => item.email.toLowerCase() === email.toLowerCase().trim() && item.password === password,
        )

        if (!account) {
          return { ok: false, message: 'Invalid email or password.' }
        }

        const authUser = toUser(account)
        set({ user: authUser })
        return { ok: true, message: `Login successful. Welcome back, ${authUser.name}!` }
      },
      register: ({ name, email, password, role, documents = [] }) => {
        const normalizedEmail = email.toLowerCase().trim()
        const { accounts } = get()

        if (accounts.some((item) => item.email.toLowerCase() === normalizedEmail)) {
          return { ok: false, message: 'An account with this email already exists.' }
        }

        if (role === 'hotel_owner' && documents.length < 2) {
          return { ok: false, message: 'Hotel owner registration requires identity and property documents.' }
        }

        const newAccount: StoredAccount = {
          id: `acc_${Date.now()}`,
          name: name.trim(),
          email: normalizedEmail,
          password,
          role,
          documents,
          verificationStatus: role === 'hotel_owner' ? 'pending' : 'verified',
        }

        const authUser = toUser(newAccount)
        set((state) => ({
          accounts: [...state.accounts, newAccount],
          user: authUser,
        }))

        if (role === 'hotel_owner') {
          return {
            ok: true,
            message: `Registration successful. ${authUser.name}, your owner account is pending verification.`,
          }
        }

        return { ok: true, message: `Registration successful. Welcome, ${authUser.name}!` }
      },
      logout: () => {
        set({ user: null })
      },
      updateProfile: (name, email) => {
        const { accounts, user } = get()

        if (!user) {
          return { ok: false, message: 'You are not authorized.' }
        }

        const normalizedEmail = email.toLowerCase().trim()
        const emailUsed = accounts.some(
          (item) => item.id !== user.id && item.email.toLowerCase() === normalizedEmail,
        )

        if (emailUsed) {
          return { ok: false, message: 'Email is already used by another account.' }
        }

        let updatedUser: AuthUser | null = null

        const nextAccounts = accounts.map((item) => {
          if (item.id !== user.id) {
            return item
          }

          const nextAccount = { ...item, name: name.trim(), email: normalizedEmail }
          updatedUser = toUser(nextAccount)
          return nextAccount
        })

        if (!updatedUser) {
          return { ok: false, message: 'Unable to update profile.' }
        }

        set({
          accounts: nextAccounts,
          user: updatedUser,
        })

        return { ok: true, message: 'Profile updated successfully.' }
      },
    }),
    {
      name: 'lankastay_auth_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        user: state.user,
      }),
    },
  ),
)
