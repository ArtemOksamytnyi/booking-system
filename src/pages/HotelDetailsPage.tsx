import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { hotels } from '../data/hotels'

const getDateOffset = (offset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

type HotelDetailsContentProps = {
  hotel: (typeof hotels)[number]
}

function HotelDetailsContent({ hotel }: HotelDetailsContentProps) {
  const navigate = useNavigate()
  const { startDraft } = useBooking()
  const [checkIn, setCheckIn] = useState(getDateOffset(1))
  const [checkOut, setCheckOut] = useState(getDateOffset(3))
  const [guests, setGuests] = useState(2)

  const similarHotels = hotels.filter((item) => item.slug !== hotel.slug).slice(0, 3)

  const days = useMemo(() => {
    const start = new Date(`${checkIn}T00:00:00`).getTime()
    const end = new Date(`${checkOut}T00:00:00`).getTime()
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24))
    return Math.max(diff, 1)
  }, [checkIn, checkOut])

  const total = days * hotel.pricePerNight

  const onReserve = () => {
    startDraft({
      hotelSlug: hotel.slug,
      checkIn,
      checkOut,
      guests,
    })
    navigate(`/booking/${hotel.slug}`)
  }

  return (
    <div className="section-container space-y-10 py-12 pb-16">
      <Link className="inline-flex text-sm font-medium text-primary hover:underline" to="/hotels">
        ← Back to catalog
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="overflow-hidden rounded-3xl bg-white shadow-sm shadow-slate-200">
          <img alt={hotel.name} className="h-[360px] w-full object-cover" src={hotel.image} />
          <div className="space-y-5 p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-primary">
                {hotel.category}
              </span>
              <span className="text-sm text-slate-500">{hotel.location}</span>
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">{hotel.name}</h1>
            <div className="flex items-center gap-6 text-sm">
              <span className="font-semibold text-amber-500">★ {hotel.rating}</span>
              <span className="text-slate-500">{hotel.reviews} reviews</span>
              <span className="font-semibold text-slate-800">${hotel.pricePerNight}/night</span>
            </div>
            <p className="text-slate-600">{hotel.description}</p>
          </div>
        </article>

        <aside className="space-y-4 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Book this hotel</h2>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Check-in</span>
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              onChange={(event) => setCheckIn(event.target.value)}
              type="date"
              value={checkIn}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Check-out</span>
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              min={checkIn}
              onChange={(event) => setCheckOut(event.target.value)}
              type="date"
              value={checkOut}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guests</span>
            <select
              className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              onChange={(event) => setGuests(Number(event.target.value))}
              value={guests}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>{`${value} Guest${value > 1 ? 's' : ''}`}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">{days}</span> days
            </p>
            <p className="mt-1">
              Total: <span className="font-semibold text-slate-900">${total}</span>
            </p>
          </div>

          <button
            className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-blue-700"
            onClick={onReserve}
            type="button"
          >
            Reserve Now
          </button>
        </aside>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-3xl bg-white p-7 shadow-sm shadow-slate-200">
          <h2 className="text-3xl font-semibold text-slate-900">Amenities</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {hotel.amenities.map((amenity) => (
              <div
                key={amenity}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                {amenity}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-7 shadow-sm shadow-slate-200">
          <h2 className="text-3xl font-semibold text-slate-900">Gallery</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {hotel.gallery.map((image, index) => (
              <img
                key={`${hotel.slug}-${index}`}
                alt={`${hotel.name} gallery ${index + 1}`}
                className={`h-40 w-full rounded-xl object-cover ${index === 0 ? 'col-span-2 h-48' : ''}`}
                src={image}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold text-slate-900">Similar Hotels</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {similarHotels.map((item) => (
            <article key={item.slug} className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200">
              <img alt={item.name} className="h-44 w-full object-cover" src={item.image} />
              <div className="space-y-2 p-5">
                <h3 className="text-xl font-semibold text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.location}</p>
                <Link
                  className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  to={`/hotels/${item.slug}`}
                >
                  View Hotel
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function HotelDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const hotel = hotels.find((item) => item.slug === slug)

  if (!hotel) {
    return <Navigate replace to="/hotels" />
  }

  return <HotelDetailsContent key={hotel.slug} hotel={hotel} />
}

export default HotelDetailsPage
