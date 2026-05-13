import { apiFetch } from './client'

type ApiVerificationRequest = {
  id: number
  owner: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
  property: {
    id: number
    name: string
  }
  admin?: {
    id: number
    firstName: string
    lastName: string
    email: string
  } | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestDate: string
  decisionDate?: string | null
  comment?: string | null
}

export type VerificationRequestDto = {
  id: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  propertyName: string
  propertyId: number
  documents: string[]
  status: 'pending' | 'approved' | 'rejected'
  ownerComment: string
  adminComment: string
  createdAt: string
  reviewedAt: string | null
}

const mapVerificationRequest = (request: ApiVerificationRequest): VerificationRequestDto => ({
  id: String(request.id),
  ownerId: String(request.owner.id),
  ownerName: `${request.owner.firstName} ${request.owner.lastName}`.trim(),
  ownerEmail: request.owner.email,
  propertyName: request.property.name,
  propertyId: request.property.id,
  documents: [],
  status: request.status.toLowerCase() as VerificationRequestDto['status'],
  ownerComment: request.comment ?? '',
  adminComment: request.status !== 'PENDING' ? request.comment ?? '' : '',
  createdAt: request.requestDate,
  reviewedAt: request.decisionDate ?? null,
})

export const getVerificationRequests = async () => {
  const requests = await apiFetch<ApiVerificationRequest[]>('/verification-requests')
  return requests.map(mapVerificationRequest)
}

export const submitVerificationRequestToApi = async (payload: {
  propertyId: number
  comment?: string
}) =>
  apiFetch<ApiVerificationRequest>('/verification-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const reviewVerificationRequestInApi = async (payload: {
  requestId: string
  status: 'APPROVED' | 'REJECTED'
  comment?: string
}) =>
  apiFetch(`/verification-requests/${payload.requestId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: payload.status,
      comment: payload.comment,
    }),
  })
