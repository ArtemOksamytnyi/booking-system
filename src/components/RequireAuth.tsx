import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { AuthRole } from '../context/AuthContext'
import type { ReactElement } from 'react'

type RequireAuthProps = {
  allow?: AuthRole[]
  children: ReactElement
}

function RequireAuth({ allow, children }: RequireAuthProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/" />
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate replace to={user.role === 'admin' ? '/admin' : '/dashboard'} />
  }

  return children
}

export default RequireAuth
