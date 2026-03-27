import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import BookingHeader from '../../components/BookingHeader'
import { useBooking } from '../../context/BookingContext'
import { hotels } from '../../data/hotels'

const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + days)
  return next.toISOString().split('T')[0]
}

const diffDays = (checkIn: string, checkOut: string) => {
  const start = new Date(`${checkIn}T00:00:00`).getTime()
  const end = new Date(`${checkOut}T00:00:00`).getTime()
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 1)
}

function BookingInformationPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { draft, startDraft, updateDraft } = useBooking()

  const hotel = hotels.find((item) => item.slug === slug)
  if (!hotel) {
    return <Navigate replace to="/hotels" />
  }

  const todayPlusOne = new Date()
  todayPlusOne.setDate(todayPlusOne.getDate() + 1)
  const defaultCheckIn = todayPlusOne.toISOString().split('T')[0]

  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [days, setDays] = useState(2)
  const [guests, setGuests] = useState(2)

  useEffect(() => {
    if (draft?.hotelSlug === hotel.slug) {
      setCheckIn(draft.checkIn)
      setDays(diffDays(draft.checkIn, draft.checkOut))
      setGuests(draft.guests)
      return
    }

    setCheckIn(defaultCheckIn)
    setDays(2)
    setGuests(2)
  }, [hotel.slug, draft?.hotelSlug, draft?.checkIn, draft?.checkOut, draft?.guests, defaultCheckIn])

  const finalCheckOut = useMemo(() => addDays(checkIn, days), [checkIn, days])
  const total = days * hotel.pricePerNight

  const persistDraft = (nextCheckIn: string, nextDays: number, nextGuests: number) => {
    const payload = {
      hotelSlug: hotel.slug,
      checkIn: nextCheckIn,
      checkOut: addDays(nextCheckIn, nextDays),
      guests: nextGuests,
    }

    if (draft?.hotelSlug === hotel.slug) {
      updateDraft(payload)
    } else {
      startDraft(payload)
    }
  }

  const reserve = () => {
    persistDraft(checkIn, days, guests)
    navigate('/payment')
  }

  return (
    <div className="space-y-8 pb-16">
      <BookingHeader
        step={1}
        subtitle="Please fill up the blank fields below"
        title="Booking Information"
      />

      <div className="section-container grid gap-6 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200 lg:grid-cols-[1fr_0.9fr]">
        <article className="space-y-3 border-slate-200 lg:border-r lg:pr-6">
          <img alt={hotel.name} className="h-72 w-full rounded-3xl object-cover" src={hotel.image} />
          <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
            <p>{hotel.name}</p>
            <p className="text-base font-normal text-slate-400">{hotel.location}</p>
          </div>
        </article>

        <article className="space-y-4 lg:pl-2">
          <div>
            <p className="text-xl font-medium text-slate-700">How long you will stay?</p>
            <div className="mt-2 flex h-12 items-center rounded-xl bg-slate-100">
              <button
                className="h-full w-14 rounded-l-xl bg-rose-500 text-2xl font-semibold text-white"
                onClick={() => {
                  const nextDays = Math.max(1, days - 1)
                  setDays(nextDays)
                  persistDraft(checkIn, nextDays, guests)
                }}
                type="button"
              >
                -
              </button>
              <p className="flex-1 text-center text-xl font-medium text-slate-800">{days} Days</p>
              <button
                className="h-full w-14 rounded-r-xl bg-emerald-500 text-2xl font-semibold text-white"
                onClick={() => {
                  const nextDays = days + 1
                  setDays(nextDays)
                  persistDraft(checkIn, nextDays, guests)
                }}
                type="button"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p className="text-xl font-medium text-slate-700">Pick a Date</p>
            <input
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-base text-slate-700 outline-none focus:border-primary"
              onChange={(event) => {
                const selectedDate = event.target.value
                setCheckIn(selectedDate)
                persistDraft(selectedDate, days, guests)
              }}
              type="date"
              value={checkIn}
            />
            <p className="mt-2 text-lg text-slate-500">
              {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(
                new Date(`${checkIn}T00:00:00`),
              )}{' '}
              -{' '}
              {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(
                new Date(`${finalCheckOut}T00:00:00`),
              )}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Guests</p>
            <select
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base text-slate-700 outline-none focus:border-primary"
              onChange={(event) => {
                const nextGuests = Number(event.target.value)
                setGuests(nextGuests)
                persistDraft(checkIn, days, nextGuests)
              }}
              value={guests}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>{`${value} Guest${value > 1 ? 's' : ''}`}</option>
              ))}
            </select>
          </div>

          <p className="text-3xl leading-tight text-slate-400">
            You will pay <span className="font-semibold text-slate-900">${total} USD</span>
            <br />
            per <span className="font-semibold text-slate-900">{days} Days</span>
          </p>
        </article>
      </div>

      <div className="section-container flex flex-col items-center gap-3">
        <button
          className="h-12 w-full max-w-md rounded-2xl bg-primary text-xl font-semibold text-white transition hover:bg-blue-700"
          onClick={reserve}
          type="button"
        >
          Book Now
        </button>
        <Link
          className="grid h-12 w-full max-w-md place-items-center rounded-2xl bg-slate-100 text-xl text-slate-400"
          to={`/hotels/${hotel.slug}`}
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}

export default BookingInformationPage
