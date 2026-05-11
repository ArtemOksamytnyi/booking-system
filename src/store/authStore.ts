import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type AuthRole = 'user' | 'hotel_owner' | 'admin'

export type VerificationStatus = 'verified' | 'pending' | 'rejected'

export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected'

type StoredAccount = {
  id: string
  name: string
  email: string
  password: string
  role: AuthRole
  documents: string[]
  verificationStatus: VerificationStatus
}

export type VerificationRequest = {
  id: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  propertyName: string
  documents: string[]
  status: VerificationRequestStatus
  ownerComment: string
  adminComment: string
  createdAt: string
  reviewedAt: string | null
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
  propertyName?: string
}

type AuthState = {
  accounts: StoredAccount[]
  verificationRequests: VerificationRequest[]
  user: AuthUser | null
  login: (email: string, password: string) => AuthResult
  register: (payload: RegisterPayload) => AuthResult
  logout: () => void
  updateProfile: (name: string, email: string) => AuthResult
  submitVerificationRequest: (payload: {
    ownerId: string
    ownerName: string
    ownerEmail: string
    propertyName: string
    documents: string[]
    ownerComment: string
  }) => AuthResult
  reviewVerificationRequest: (
    requestId: string,
    status: VerificationRequestStatus,
    adminComment: string,
  ) => AuthResult
}

const seedAccounts: StoredAccount[] = [
  {
    id: 'acc_admin_1',
    name: 'Salman Faris',
    email: 'admin@lankastay.com',
    password: 'password123',
    role: 'admin',
    documents: [],
    verificationStatus: 'verified',
  },
  {
    id: 'acc_user_1',
    name: 'John Wick',
    email: 'user@lankastay.com',
    password: 'password123',
    role: 'user',
    documents: [],
    verificationStatus: 'verified',
  },
  {
    id: 'acc_owner_1',
    name: 'Ina Hogan',
    email: 'ina.owner@lankastay.com',
    password: 'password123',
    role: 'hotel_owner',
    documents: ['business-license.pdf', 'property-proof.pdf'],
    verificationStatus: 'verified',
  },
  {
    id: 'acc_owner_2',
    name: 'Devin Harmon',
    email: 'devin.owner@lankastay.com',
    password: 'password123',
    role: 'hotel_owner',
    documents: ['devin-id.pdf', 'devin-property.pdf'],
    verificationStatus: 'pending',
  },
  {
    id: 'acc_owner_3',
    name: 'Lena Page',
    email: 'lena.owner@lankastay.com',
    password: 'password123',
    role: 'hotel_owner',
    documents: ['lena-id.pdf', 'lena-property.pdf'],
    verificationStatus: 'pending',
  },
]

const seedVerificationRequests: VerificationRequest[] = [
  {
    id: 'verify_req_1',
    ownerId: 'acc_owner_2',
    ownerName: 'Devin Harmon',
    ownerEmail: 'devin.owner@lankastay.com',
    propertyName: 'City Nest Kotte',
    documents: ['devin-id.pdf', 'devin-property.pdf'],
    status: 'pending',
    ownerComment: 'Please verify my ownership documents for City Nest Kotte.',
    adminComment: '',
    createdAt: new Date('2026-05-01T10:00:00.000Z').toISOString(),
    reviewedAt: null,
  },
  {
    id: 'verify_req_2',
    ownerId: 'acc_owner_3',
    ownerName: 'Lena Page',
    ownerEmail: 'lena.owner@lankastay.com',
    propertyName: 'Ocean Land Trincomalee',
    documents: ['lena-id.pdf', 'lena-property.pdf'],
    status: 'pending',
    ownerComment: 'Submitting updated documents for my hotel verification.',
    adminComment: '',
    createdAt: new Date('2026-05-03T14:20:00.000Z').toISOString(),
    reviewedAt: null,
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
      verificationRequests: seedVerificationRequests,
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
      register: ({ name, email, password, role, documents = [], propertyName = 'Owner Property' }) => {
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
        set((state) => {
          const nextState: Pick<AuthState, 'accounts' | 'user' | 'verificationRequests'> = {
            accounts: [...state.accounts, newAccount],
            user: authUser,
            verificationRequests: state.verificationRequests,
          }

          if (role === 'hotel_owner') {
            nextState.verificationRequests = [
              {
                id: `verify_req_${Date.now()}`,
                ownerId: newAccount.id,
                ownerName: newAccount.name,
                ownerEmail: newAccount.email,
                propertyName,
                documents,
                status: 'pending',
                ownerComment: 'Verification request created during registration.',
                adminComment: '',
                createdAt: new Date().toISOString(),
                reviewedAt: null,
              },
              ...state.verificationRequests,
            ]
          }

          return nextState
        })

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
      submitVerificationRequest: ({ ownerId, ownerName, ownerEmail, propertyName, documents, ownerComment }) => {
        if (!propertyName.trim()) {
          return { ok: false, message: 'Property name is required for verification.' }
        }

        set((state) => ({
          verificationRequests: [
            {
              id: `verify_req_${Date.now()}`,
              ownerId,
              ownerName,
              ownerEmail,
              propertyName: propertyName.trim(),
              documents,
              status: 'pending',
              ownerComment: ownerComment.trim(),
              adminComment: '',
              createdAt: new Date().toISOString(),
              reviewedAt: null,
            },
            ...state.verificationRequests,
          ],
          accounts: state.accounts.map((account) =>
            account.id === ownerId ? { ...account, verificationStatus: 'pending' } : account,
          ),
          user:
            state.user?.id === ownerId ? { ...state.user, verificationStatus: 'pending' } : state.user,
        }))

        return { ok: true, message: 'Verification request submitted to admin.' }
      },
      reviewVerificationRequest: (requestId, status, adminComment) => {
        const request = get().verificationRequests.find((item) => item.id === requestId)
        if (!request) {
          return { ok: false, message: 'Verification request not found.' }
        }

        const verificationStatus: VerificationStatus =
          status === 'approved' ? 'verified' : 'rejected'

        set((state) => ({
          verificationRequests: state.verificationRequests.map((item) =>
            item.id === requestId
              ? {
                  ...item,
                  status,
                  adminComment: adminComment.trim(),
                  reviewedAt: new Date().toISOString(),
                }
              : item,
          ),
          accounts: state.accounts.map((account) =>
            account.id === request.ownerId ? { ...account, verificationStatus } : account,
          ),
          user:
            state.user?.id === request.ownerId
              ? { ...state.user, verificationStatus }
              : state.user,
        }))

        return {
          ok: true,
          message:
            status === 'approved'
              ? 'Verification request approved.'
              : 'Verification request rejected.',
        }
      },
    }),
    {
      name: 'lankastay_auth_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        verificationRequests: state.verificationRequests,
        user: state.user,
      }),
    },
  ),
)
