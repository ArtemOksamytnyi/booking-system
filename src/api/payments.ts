import { apiFetch } from './client'

export const createPaymentRequest = async (payload: {
  bookingId: number
  amount: number
  paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'CASH'
}) =>
  apiFetch('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
