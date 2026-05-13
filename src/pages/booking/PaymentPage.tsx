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

function PaymentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { draft, clearDraft } = useBooking()

  const [cardNumber, setCardNumber] = useState('')
  const [bank, setBank] = useState('')
  const [expDate, setExpDate] = useState('')
  const [cvv, setCvv] = useState('')

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!draft) {
        throw new Error('Booking draft is missing')
      }

      const days = daysBetween(draft.checkIn, draft.checkOut)
      const initialPayment = Math.round((days * draft.roomPricePerNight) / 2)

      const booking = await createBookingRequest({
        roomId: draft.roomId,
        startDatetime: `${draft.checkIn}T00:00:00.000Z`,
        endDatetime: `${draft.checkOut}T00:00:00.000Z`,
      })

      await createPaymentRequest({
        bookingId: booking.id,
        amount: initialPayment,
        paymentMethod: 'CARD',
      })
    },
    onSuccess: () => {
      clearDraft()
      navigate('/payment/success')
    },
  })

  if (!user || !draft) {
    return <Navigate replace to="/hotels" />
  }

  const days = daysBetween(draft.checkIn, draft.checkOut)
  const total = days * draft.roomPricePerNight
  const initialPayment = Math.round(total / 2)

  const payNow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!cardNumber || !bank || !expDate || !cvv) {
      return
    }

    await bookingMutation.mutateAsync()
  }

  return (
    <div className="space-y-6 pb-14">
      <BookingHeader step={2} subtitle="Kindly follow the instructions below" title="Payment" />

      <div className="section-container grid gap-5 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200 lg:grid-cols-[1fr_0.9fr] lg:p-6">
        <article className="space-y-4 border-slate-200 lg:border-r lg:pr-7">
          <p className="text-xl leading-relaxed text-slate-800 md:text-2xl">
            Transfer LankaStay:
            <br />
            <br />
            {days} Days at {draft.hotelName},
            <br />
            {draft.location}
            <br />
            Room: {draft.roomName}
            <br />
            <br />
            Total: <span className="font-semibold text-slate-900">${total} USD</span>
            <br />
            <br />
            Initial Payment: <span className="font-semibold text-slate-900">${initialPayment}</span>
          </p>
        </article>

        <form className="space-y-3 lg:pl-2" onSubmit={payNow}>
          <label className="grid gap-1 text-sm font-medium text-slate-800 md:text-base">
            Card Number
            <input
              className="h-11 rounded-xl bg-slate-100 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30 md:text-base"
              onChange={(event) => setCardNumber(event.target.value)}
              placeholder="Payment card number"
              value={cardNumber}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-800 md:text-base">
            Bank
            <input
              className="h-11 rounded-xl bg-slate-100 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30 md:text-base"
              onChange={(event) => setBank(event.target.value)}
              placeholder="Select Bank"
              value={bank}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-800 md:text-base">
            Exp Date
            <input
              className="h-11 rounded-xl bg-slate-100 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30 md:text-base"
              onChange={(event) => setExpDate(event.target.value)}
              placeholder="MM/YY"
              value={expDate}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-800 md:text-base">
            CVV
            <input
              className="h-11 rounded-xl bg-slate-100 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30 md:text-base"
              onChange={(event) => setCvv(event.target.value)}
              placeholder="Beside the card"
              value={cvv}
            />
          </label>

          <button
            className="mt-5 h-11 w-full rounded-2xl bg-primary text-base font-semibold text-white md:text-lg"
            type="submit"
          >
            {bookingMutation.isPending ? 'Processing...' : 'Pay Now'}
          </button>
          <Link
            className="grid h-11 w-full place-items-center rounded-2xl bg-slate-100 text-base text-slate-400 md:text-lg"
            to={`/booking/${draft.hotelSlug}`}
          >
            Cancel
          </Link>
        </form>
      </div>
    </div>
  )
}

export default PaymentPage
