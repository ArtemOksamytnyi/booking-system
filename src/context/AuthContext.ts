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
  VerificationStatus,
} from '../store/authStore'

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => AuthResult
  register: (payload: RegisterPayload) => AuthResult
  logout: () => void
  updateProfile: (name: string, email: string) => AuthResult
}

export const useAuth = (): AuthContextValue => {
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const updateProfile = useAuthStore((state) => state.updateProfile)

  return {
    user,
    login,
    register,
    logout,
    updateProfile,
  }
}

export { getDashboardPath, humanizeRole }
export type { AuthResult, AuthRole, AuthUser, RegisterPayload, VerificationStatus }
