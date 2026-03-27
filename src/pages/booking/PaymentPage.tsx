import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import BookingHeader from '../../components/BookingHeader'
import { useAuth } from '../../context/AuthContext'
import { useBooking } from '../../context/BookingContext'
import { hotels } from '../../data/hotels'

const daysBetween = (checkIn: string, checkOut: string) => {
  const start = new Date(`${checkIn}T00:00:00`).getTime()
  const end = new Date(`${checkOut}T00:00:00`).getTime()
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

function PaymentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { draft, finalizeBooking } = useBooking()

  const [cardNumber, setCardNumber] = useState('')
  const [bank, setBank] = useState('')
  const [expDate, setExpDate] = useState('')
  const [cvv, setCvv] = useState('')

  if (!user || !draft) {
    return <Navigate replace to="/hotels" />
  }

  const hotel = hotels.find((item) => item.slug === draft.hotelSlug)
  if (!hotel) {
    return <Navigate replace to="/hotels" />
  }

  const days = daysBetween(draft.checkIn, draft.checkOut)
  const total = days * hotel.pricePerNight
  const initialPayment = Math.round(total / 2)

  const payNow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!cardNumber || !bank || !expDate || !cvv) {
      return
    }

    finalizeBooking(user.email)
    navigate('/payment/success')
  }

  return (
    <div className="space-y-8 pb-16">
      <BookingHeader step={2} subtitle="Kindly follow the instructions below" title="Payment" />

      <div className="section-container grid gap-6 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200 lg:grid-cols-[1fr_0.9fr]">
        <article className="space-y-4 border-slate-200 lg:border-r lg:pr-8">
          <p className="text-3xl leading-relaxed text-slate-800">
            Transfer LankaStay:
            <br />
            <br />
            {days} Days at {hotel.name},
            <br />
            {hotel.location}
            <br />
            <br />
            Total: <span className="font-semibold text-slate-900">${total} USD</span>
            <br />
            <br />
            Initial Payment: <span className="font-semibold text-slate-900">${initialPayment}</span>
          </p>
        </article>

        <form className="space-y-3 lg:pl-3" onSubmit={payNow}>
          <label className="grid gap-1 text-lg text-slate-800">
            Card Number
            <input
              className="h-12 rounded-xl bg-slate-100 px-4 text-base text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setCardNumber(event.target.value)}
              placeholder="Payment card number"
              value={cardNumber}
            />
          </label>

          <label className="grid gap-1 text-lg text-slate-800">
            Bank
            <input
              className="h-12 rounded-xl bg-slate-100 px-4 text-base text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setBank(event.target.value)}
              placeholder="Select Bank"
              value={bank}
            />
          </label>

          <label className="grid gap-1 text-lg text-slate-800">
            Exp Date
            <input
              className="h-12 rounded-xl bg-slate-100 px-4 text-base text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setExpDate(event.target.value)}
              placeholder="MM/YY"
              value={expDate}
            />
          </label>

          <label className="grid gap-1 text-lg text-slate-800">
            CVV
            <input
              className="h-12 rounded-xl bg-slate-100 px-4 text-base text-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setCvv(event.target.value)}
              placeholder="Beside the card"
              value={cvv}
            />
          </label>

          <button className="mt-6 h-12 w-full rounded-2xl bg-primary text-xl font-semibold text-white" type="submit">
            Pay Now
          </button>
          <Link
            className="grid h-12 w-full place-items-center rounded-2xl bg-slate-100 text-xl text-slate-400"
            to={`/booking/${hotel.slug}`}
          >
            Cancel
          </Link>
        </form>
      </div>
    </div>
  )
}

export default PaymentPage
