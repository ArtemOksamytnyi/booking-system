import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { AuthenticatedUser, JwtPayload } from '../types/auth'
import { HttpError } from '../utils/http'

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser
}

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null
  }

  return authorizationHeader.slice(7)
}

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const token = getBearerToken(req.headers.authorization)

  if (!token) {
    return next(new HttpError(401, 'Authentication required'))
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = payload
    return next()
  } catch {
    return next(new HttpError(401, 'Invalid or expired token'))
  }
}

export const requireRole =
  (allowedRoles: JwtPayload['role'][]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication required'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have access to this resource'))
    }

    return next()
  }
