const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const AUTH_STORAGE_KEY = 'lankastay_auth_store_v3'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const persistedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
  const token = persistedAuth ? JSON.parse(persistedAuth)?.state?.token : null

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const validationErrors = payload?.issues?.fieldErrors
      ? Object.values(payload.issues.fieldErrors)
          .flat()
          .filter(Boolean)
          .join(' ')
      : ''

    throw new ApiError(validationErrors || payload?.message || 'Request failed', response.status)
  }

  return response.json() as Promise<T>
}
