import { getDashboardPath, humanizeRole, useAuthStore } from '../store/authStore'
import type {
  AuthResult,
  AuthRole,
  AuthUser,
  RegisterPayload,
  VerificationStatus,
} from '../store/authStore'

type AuthContextValue = {
  user: AuthUser | null
  isHydrating: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (payload: RegisterPayload) => Promise<AuthResult>
  logout: () => void
  updateProfile: (name: string, email: string) => Promise<AuthResult>
  hydrateUser: () => Promise<void>
}

export const useAuth = (): AuthContextValue => {
  const user = useAuthStore((state) => state.user)
  const isHydrating = useAuthStore((state) => state.isHydrating)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const hydrateUser = useAuthStore((state) => state.hydrateUser)

  return {
    user,
    isHydrating,
    login,
    register,
    logout,
    updateProfile,
    hydrateUser,
  }
}

export { getDashboardPath, humanizeRole }
export type {
  AuthResult,
  AuthRole,
  AuthUser,
  RegisterPayload,
  VerificationStatus,
}
