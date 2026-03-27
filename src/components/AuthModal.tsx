import { useMemo, useState } from 'react'
import { humanizeRole, useAuth } from '../context/AuthContext'
import type { AuthRole } from '../context/AuthContext'

export type AuthMode = 'login' | 'register'

type AuthModalProps = {
  mode: AuthMode
  onClose: () => void
  onSwitchMode: (mode: AuthMode) => void
  onSuccess: (message: string) => void
}

function AuthModal({ mode, onClose, onSwitchMode, onSuccess }: AuthModalProps) {
  const { login, register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AuthRole>('user')
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [propertyDocument, setPropertyDocument] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isRegister = mode === 'register'
  const isOwnerRegistration = isRegister && role === 'hotel_owner'

  const title = useMemo(() => (isRegister ? 'Create your account' : 'Welcome back'), [isRegister])
  const submitText = isRegister ? 'Create Account' : 'Login'

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (isOwnerRegistration && (!idDocument || !propertyDocument)) {
      setError('Hotel owner registration requires both identity and property documents.')
      return
    }

    const result = isRegister
      ? register({
          name,
          email,
          password,
          role,
          documents: isOwnerRegistration
            ? [idDocument?.name ?? '', propertyDocument?.name ?? '']
            : [],
        })
      : login(email.trim().toLowerCase(), password)

    if (!result.ok) {
      setError(result.message)
      return
    }

    onSuccess(result.message)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl shadow-slate-900/20">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              {isRegister ? 'Register' : 'Login'}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h2>
            {!isRegister ? (
              <p className="mt-2 text-xs text-slate-500">
                Demo: user@lankastay.com/user123, owner@lankastay.com/owner123, admin@lankastay.com/admin123
              </p>
            ) : null}
          </div>
          <button
            aria-label="Close"
            className="rounded-lg border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Full Name</span>
              <input
                className="h-12 rounded-xl border border-slate-200 px-4 outline-none transition focus:border-primary"
                onChange={(event) => setName(event.target.value)}
                placeholder="John Doe"
                required
                value={name}
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="h-12 rounded-xl border border-slate-200 px-4 outline-none transition focus:border-primary"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="john@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              className="h-12 rounded-xl border border-slate-200 px-4 outline-none transition focus:border-primary"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 symbols"
              required
              type="password"
              value={password}
            />
          </label>

          {isRegister ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Account Type</span>
              <select
                className="h-12 rounded-xl border border-slate-200 px-4 outline-none transition focus:border-primary"
                onChange={(event) => setRole(event.target.value as AuthRole)}
                value={role}
              >
                <option value="user">User</option>
                <option value="hotel_owner">Hotel Owner</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          ) : null}

          {isOwnerRegistration ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Owner verification documents</p>
              <label className="grid gap-2">
                <span className="text-xs text-slate-500">Identity document</span>
                <input
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="text-sm"
                  onChange={(event) => setIdDocument(event.target.files?.[0] ?? null)}
                  required
                  type="file"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs text-slate-500">Property ownership document</span>
                <input
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="text-sm"
                  onChange={(event) => setPropertyDocument(event.target.files?.[0] ?? null)}
                  required
                  type="file"
                />
              </label>
              <p className="text-xs text-slate-500">Selected role: {humanizeRole(role)}</p>
            </div>
          ) : null}

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <button
            className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-blue-700"
            type="submit"
          >
            {submitText}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            className="font-semibold text-primary"
            onClick={() => {
              setError(null)
              onSwitchMode(isRegister ? 'login' : 'register')
            }}
            type="button"
          >
            {isRegister ? 'Login now' : 'Register now'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthModal
