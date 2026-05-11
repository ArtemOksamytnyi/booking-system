import {
  getDashboardPath,
  humanizeRole,
  useAuthStore,
} from '../store/authStore'
import type {
  AuthResult,
  AuthRole,
  AuthUser,
  RegisterPayload,
  VerificationRequest,
  VerificationStatus,
} from '../store/authStore'

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => AuthResult
  register: (payload: RegisterPayload) => AuthResult
  logout: () => void
  updateProfile: (name: string, email: string) => AuthResult
  verificationRequests: VerificationRequest[]
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
    status: 'pending' | 'approved' | 'rejected',
    adminComment: string,
  ) => AuthResult
}

export const useAuth = (): AuthContextValue => {
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const verificationRequests = useAuthStore((state) => state.verificationRequests)
  const submitVerificationRequest = useAuthStore((state) => state.submitVerificationRequest)
  const reviewVerificationRequest = useAuthStore((state) => state.reviewVerificationRequest)

  return {
    user,
    login,
    register,
    logout,
    updateProfile,
    verificationRequests,
    submitVerificationRequest,
    reviewVerificationRequest,
  }
}

export { getDashboardPath, humanizeRole }
export type {
  AuthResult,
  AuthRole,
  AuthUser,
  RegisterPayload,
  VerificationRequest,
  VerificationStatus,
}
