import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardPath, useAuth } from '../../context/AuthContext'

function ProfilePage() {
  const { user, updateProfile } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return null
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const result = await updateProfile(name, email)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(result.message)
  }

  return (
    <div className="section-container py-12 pb-16">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-semibold text-slate-900">Profile</h1>
          <Link className="text-sm font-semibold text-primary hover:underline" to={getDashboardPath(user.role)}>
            Go to Dashboard
          </Link>
        </div>

        <form className="space-y-4" onSubmit={save}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Full Name</span>
            <input
              className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <button className="h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-white" type="submit">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage
