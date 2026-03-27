import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

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

type AuthResult = {
  ok: boolean
  message: string
}

type RegisterPayload = {
  name: string
  email: string
  password: string
  role: AuthRole
  documents?: string[]
}

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => AuthResult
  register: (payload: RegisterPayload) => AuthResult
  logout: () => void
  updateProfile: (name: string, email: string) => AuthResult
}

const ACCOUNTS_KEY = 'lankastay_accounts_v1'
const USER_KEY = 'lankastay_user_v1'

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

const AuthContext = createContext<AuthContextValue | null>(null)

const toUser = (account: StoredAccount): AuthUser => ({
  id: account.id,
  name: account.name,
  email: account.email,
  role: account.role,
  documents: account.documents,
  verificationStatus: account.verificationStatus,
})

const readAccounts = (): StoredAccount[] => {
  const raw = localStorage.getItem(ACCOUNTS_KEY)
  if (!raw) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seedAccounts))
    return seedAccounts
  }

  try {
    const parsed = JSON.parse(raw) as StoredAccount[]
    return parsed.length ? parsed : seedAccounts
  } catch {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seedAccounts))
    return seedAccounts
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const loadedAccounts = readAccounts()
    setAccounts(loadedAccounts)

    const rawUser = localStorage.getItem(USER_KEY)
    if (!rawUser) {
      return
    }

    try {
      const parsed = JSON.parse(rawUser) as AuthUser
      const matched = loadedAccounts.find((account) => account.id === parsed.id)
      setUser(matched ? toUser(matched) : null)
    } catch {
      setUser(null)
    }
  }, [])

  const persistAccounts = (nextAccounts: StoredAccount[]) => {
    setAccounts(nextAccounts)
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts))
  }

  const login = (email: string, password: string): AuthResult => {
    const account = accounts.find(
      (item) => item.email.toLowerCase() === email.toLowerCase().trim() && item.password === password,
    )

    if (!account) {
      return { ok: false, message: 'Invalid email or password.' }
    }

    const authUser = toUser(account)
    setUser(authUser)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    return { ok: true, message: `Login successful. Welcome back, ${authUser.name}!` }
  }

  const register = ({ name, email, password, role, documents = [] }: RegisterPayload): AuthResult => {
    const normalizedEmail = email.toLowerCase().trim()

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

    const nextAccounts = [...accounts, newAccount]
    persistAccounts(nextAccounts)

    const authUser = toUser(newAccount)
    setUser(authUser)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))

    if (role === 'hotel_owner') {
      return {
        ok: true,
        message: `Registration successful. ${authUser.name}, your owner account is pending verification.`,
      }
    }

    return { ok: true, message: `Registration successful. Welcome, ${authUser.name}!` }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(USER_KEY)
  }

  const updateProfile = (name: string, email: string): AuthResult => {
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

    const nextAccounts = accounts.map((item) =>
      item.id === user.id ? { ...item, name: name.trim(), email: normalizedEmail } : item,
    )

    persistAccounts(nextAccounts)

    const updatedAccount = nextAccounts.find((item) => item.id === user.id)
    if (!updatedAccount) {
      return { ok: false, message: 'Unable to update profile.' }
    }

    const updatedUser = toUser(updatedAccount)
    setUser(updatedUser)
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))

    return { ok: true, message: 'Profile updated successfully.' }
  }

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, accounts],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

export default AuthProvider
