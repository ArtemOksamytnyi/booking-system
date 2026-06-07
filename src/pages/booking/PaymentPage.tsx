import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { createBookingRequest } from '../../api/bookings'
import { createPaymentRequest } from '../../api/payments'
import BookingHeader from '../../components/BookingHeader'
import { useAuth } from '../../context/AuthContext'
import { useBooking } from '../../context/BookingContext'

const daysBetween = (checkIn: string, checkOut: string) => {
  const start = new Date(`${checkIn}T00:00:00`).getTime()
  const end = new Date(`${checkOut}T00:00:00`).getTime()
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

const canPayPartially = (checkIn: string) =>
  new Date(`${checkIn}T00:00:00.000Z`).getTime() > Date.now() + 24 * 60 * 60 * 1000

function PaymentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { draft } = useBooking()
  const isPartialPaymentAvailable = draft ? canPayPartially(draft.checkIn) : false

  const [cardNumber, setCardNumber] = useState('')
  const [bank, setBank] = useState('')
  const [expDate, setExpDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [paymentType, setPaymentType] = useState<'partial' | 'full'>(() =>
    isPartialPaymentAvailable ? 'partial' : 'full',
  )
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER' | 'CASH'>('CARD')

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!draft) {
        throw new Error('Booking draft is missing')
      }

      const days = daysBetween(draft.checkIn, draft.checkOut)
      const totalAmount = days * draft.roomPricePerNight
      const amountToPay = paymentType === 'full' ? totalAmount : Math.round(totalAmount / 2)

      const booking = await createBookingRequest({
        roomId: draft.roomId,
        startDatetime: `${draft.checkIn}T00:00:00.000Z`,
        endDatetime: `${draft.checkOut}T00:00:00.000Z`,
      })

      await createPaymentRequest({
        bookingId: booking.id,
        amount: amountToPay,
        paymentMethod,
      })
    },
    onSuccess: () => {
      navigate('/payment/success')
    },
  })

  if (!user || !draft) {
    return <Navigate replace to="/hotels" />
  }

  const days = daysBetween(draft.checkIn, draft.checkOut)
  const total = days * draft.roomPricePerNight
  const initialPayment = Math.round(total / 2)
  const amountToPay = paymentType === 'full' ? total : initialPayment

  const payNow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (paymentMethod === 'CARD' && (!cardNumber || !expDate || !cvv)) {
      return
    }

    if (paymentMethod === 'BANK_TRANSFER' && !bank) {
      return
    }

    await bookingMutation.mutateAsync()
  }

  return (
    <div className="space-y-3 pb-3">
      <BookingHeader compact step={2} subtitle="Kindly follow the instructions below" title="Payment" />

      <div className="section-container grid gap-4 rounded-lg bg-white p-4 shadow-sm shadow-slate-200 lg:grid-cols-[0.8fr_1fr]">
        <article className="border-slate-200 lg:border-r lg:pr-5">
          <h2 className="text-xl font-semibold text-slate-900">Booking summary</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">{draft.hotelName}</span> · {draft.location}</p>
            <p>{days} Days · Room: {draft.roomName}</p>
            <p>Total: <span className="font-semibold text-slate-900">${total} USD</span></p>
            <p>Initial Payment: <span className="font-semibold text-slate-900">${initialPayment}</span></p>
          </div>
        </article>

        <form className="space-y-2 lg:pl-1" onSubmit={payNow}>
          <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-800">
            Payment Type
            <select
              className="h-9 rounded-lg bg-slate-100 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setPaymentType(event.target.value as 'partial' | 'full')}
              value={paymentType}
            >
              <option disabled={!isPartialPaymentAvailable} value="partial">
                Partial payment
              </option>
              <option value="full">Full payment</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-800">
            Payment Method
            <select
              className="h-9 rounded-lg bg-slate-100 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setPaymentMethod(event.target.value as 'CARD' | 'BANK_TRANSFER' | 'CASH')}
              value={paymentMethod}
            >
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </label>
          </div>
          {!isPartialPaymentAvailable ? (
            <p className="text-xs text-amber-700">Bookings starting within 24 hours must be paid in full.</p>
          ) : null}

          {paymentMethod === 'CARD' ? (
            <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-800 sm:col-span-2">
            Card Number
            <input
              className="h-9 rounded-lg bg-slate-100 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setCardNumber(event.target.value)}
              placeholder="Payment card number"
              value={cardNumber}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-800">
            Exp Date
            <input
              className="h-9 rounded-lg bg-slate-100 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setExpDate(event.target.value)}
              placeholder="MM/YY"
              value={expDate}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-800">
            CVV
            <input
              className="h-9 rounded-lg bg-slate-100 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setCvv(event.target.value)}
              placeholder="Beside the card"
              value={cvv}
            />
          </label>
            </div>
          ) : null}

          {paymentMethod === 'BANK_TRANSFER' ? (
            <label className="grid gap-1 text-sm font-medium text-slate-800">
              Bank
              <input
                className="h-9 rounded-lg bg-slate-100 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
                onChange={(event) => setBank(event.target.value)}
                placeholder="Bank name"
                value={bank}
              />
            </label>
          ) : null}

          {paymentMethod === 'CASH' ? (
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
              Cash payment will be marked in the system and still wait for owner approval.
            </div>
          ) : null}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            You are about to pay <span className="font-semibold text-slate-900">${amountToPay}</span> via{' '}
            <span className="font-semibold text-slate-900">{paymentMethod.replace('_', ' ').toLowerCase()}</span>.
          </div>
          {bookingMutation.error ? (
            <p className="text-sm text-red-600">{bookingMutation.error.message}</p>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            className="h-9 w-full rounded-lg bg-primary text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={bookingMutation.isPending}
            type="submit"
          >
            {bookingMutation.isPending ? 'Processing...' : 'Pay Now'}
          </button>
          <Link
            className="grid h-9 w-full place-items-center rounded-lg bg-slate-100 text-sm text-slate-500"
            to={`/booking/${draft.hotelSlug}`}
          >
            Cancel
          </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentPage
