import { useEffect, useMemo, useState } from 'react'
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
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AuthRole>('user')
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [propertyDocument, setPropertyDocument] = useState<File | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [propertyTypeName, setPropertyTypeName] = useState<'hotel' | 'villa' | 'apartment' | 'resort'>('hotel')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [propertyDescription, setPropertyDescription] = useState('')
  const [propertyPhotoUrl, setPropertyPhotoUrl] = useState('')
  const [ownerComment, setOwnerComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isRegister = mode === 'register'
  const isOwnerRegistration = isRegister && role === 'hotel_owner'

  const title = useMemo(() => (isRegister ? 'Create your account' : 'Welcome back'), [isRegister])
  const submitText = isRegister ? 'Create Account' : 'Login'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
          phone,
          age: age ? Number(age) : undefined,
          password,
          role,
          propertyName,
          propertyTypeName,
          propertyAddress,
          propertyDescription,
          propertyPhotoUrl,
          ownerComment,
          documents: isOwnerRegistration
            ? [idDocument?.name ?? '', propertyDocument?.name ?? '']
            : [],
        })
      : login(email.trim().toLowerCase(), password)

    const authResult = await result

    if (!authResult.ok) {
      setError(authResult.message)
      return
    }

    onSuccess(authResult.message)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/50 px-4 py-6">
      <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              {isRegister ? 'Register' : 'Login'}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h2>
            {!isRegister ? (
              <p className="mt-2 text-xs text-slate-500">
                Demo: user@lankastay.com/password123, ina.owner@lankastay.com/password123,
                admin@lankastay.com/password123
              </p>
            ) : role === 'hotel_owner' ? (
              <p className="mt-2 text-xs text-slate-500">
                Owner account and hotel will be created together, then the hotel will go straight to verification.
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

        <form className="space-y-4 overflow-y-auto px-6 py-5" onSubmit={handleSubmit}>
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

          {isRegister ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <input
                  className="h-12 rounded-xl border border-slate-200 px-4 outline-none transition focus:border-primary"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+380..."
                  required
                  value={phone}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Age</span>
                <input
                  className="h-12 rounded-xl border border-slate-200 px-4 outline-none transition focus:border-primary"
                  min={18}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="29"
                  required
                  type="number"
                  value={age}
                />
              </label>
            </div>
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
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 symbols"
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
              <p className="text-sm font-semibold text-slate-700">Hotel and verification details</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs text-slate-500">Property name</span>
                  <input
                    className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                    onChange={(event) => setPropertyName(event.target.value)}
                    placeholder="Azure Retreat"
                    required
                    value={propertyName}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs text-slate-500">Property type</span>
                  <select
                    className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                    onChange={(event) =>
                      setPropertyTypeName(event.target.value as 'hotel' | 'villa' | 'apartment' | 'resort')
                    }
                    value={propertyTypeName}
                  >
                    <option value="hotel">Hotel</option>
                    <option value="villa">Villa</option>
                    <option value="apartment">Apartment</option>
                    <option value="resort">Resort</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-xs text-slate-500">Address</span>
                <input
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                  onChange={(event) => setPropertyAddress(event.target.value)}
                  placeholder="Galle, Sri Lanka"
                  required
                  value={propertyAddress}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs text-slate-500">Description</span>
                <textarea
                  className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary"
                  onChange={(event) => setPropertyDescription(event.target.value)}
                  placeholder="Describe the property"
                  value={propertyDescription}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs text-slate-500">Photo URL</span>
                <input
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                  onChange={(event) => setPropertyPhotoUrl(event.target.value)}
                  placeholder="https://..."
                  type="url"
                  value={propertyPhotoUrl}
                />
              </label>
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
              <label className="grid gap-2">
                <span className="text-xs text-slate-500">Verification comment</span>
                <textarea
                  className="min-h-20 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary"
                  onChange={(event) => setOwnerComment(event.target.value)}
                  placeholder="Anything admin should know about your documents or property?"
                  value={ownerComment}
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

        <p className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
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
