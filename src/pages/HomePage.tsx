import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  buildHotelSlug,
  getHighlightsFromHotels,
  getProperties,
  getSuperHostProperties,
} from '../api/properties'
import { useUiStore } from '../store/uiStore'

const StatIcon = ({ path }: { path: string }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-primary" fill="none" strokeWidth="1.8">
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const addDays = (date: string, offset: number) => {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + offset)
  return next.toISOString().split('T')[0]
}

function HomePage() {
  const navigate = useNavigate()
  const hotelFilters = useUiStore((state) => state.hotelFilters)
  const updateHotelFilters = useUiStore((state) => state.updateHotelFilters)
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['properties', 'home'],
    queryFn: () => getProperties(),
  })
  const { data: superHostHotels = [] } = useQuery({
    queryKey: ['properties', 'super-hosts'],
    queryFn: getSuperHostProperties,
  })

  const cities = useMemo(() => ['All', ...new Set(hotels.map((hotel) => hotel.city))], [hotels])
  const highlights = useMemo(() => getHighlightsFromHotels(hotels), [hotels])
  const featuredHotels = useMemo(
    () => (superHostHotels.length > 0 ? superHostHotels.slice(0, 8) : hotels.slice(0, 8)),
    [hotels, superHostHotels],
  )
  const { city, checkIn, checkOut, guests } = hotelFilters

  const submitSearch = () => {
    navigate('/hotels')
  }

  return (
    <div className="section-container space-y-20 py-12 pb-16">
      <section className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-6 pt-4">
          <h1 className="max-w-md text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
            Forget Busy Work,
            <br />
            Start Next Vacation
          </h1>
          <p className="max-w-sm text-slate-400">
            We provide what you need to enjoy your holiday with family. Time to make another
            memorable moments.
          </p>
          <button className="rounded-lg bg-primary px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-300/70 transition hover:bg-blue-700">
            Show More
          </button>

          <div className="flex flex-wrap gap-10 pt-8">
            <div className="space-y-1">
              <div className="mb-1 flex items-center gap-2">
                <StatIcon path="M8 7h8M8 11h8M8 15h5M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
              </div>
              <p className="text-sm">
                <span className="font-semibold text-slate-900">2500</span>{' '}
                <span className="text-slate-400">Users</span>
              </p>
            </div>
            <div className="space-y-1">
              <div className="mb-1 flex items-center gap-2">
                <StatIcon path="M8 7h8m-7 4h6m5-1a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 7h6v8H9z" />
              </div>
              <p className="text-sm">
                <span className="font-semibold text-slate-900">{hotels.length || 0}</span>{' '}
                <span className="text-slate-400">properties</span>
              </p>
            </div>
            <div className="space-y-1">
              <div className="mb-1 flex items-center gap-2">
                <StatIcon path="M12 22s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              </div>
              <p className="text-sm">
                <span className="font-semibold text-slate-900">{cities.length - 1 || 0}</span>{' '}
                <span className="text-slate-400">cities</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] pt-2">
          <div className="absolute right-0 top-12 h-[360px] w-[90%] rounded-2xl border border-slate-300" />
          <img
            src={
              featuredHotels[0]?.image ??
              'https://images.unsplash.com/photo-1616594039964-8b8f66f9f6f0?auto=format&fit=crop&w=1200&q=80'
            }
            alt="Room with warm sunlight"
            className="relative z-10 h-[360px] w-full rounded-2xl object-cover"
          />
        </div>
      </section>

      <section className="rounded-3xl bg-[#eaf0ff] px-5 py-5 shadow-sm md:px-7">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_0.9fr_auto]">
          <select
            className="h-14 rounded-xl bg-white px-4 text-sm font-medium text-slate-700 shadow-md shadow-slate-300/70 outline-none transition focus:ring-2 focus:ring-primary/20"
            onChange={(event) => updateHotelFilters({ city: event.target.value })}
            value={city}
          >
            {cities.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'Select location' : item}
              </option>
            ))}
          </select>
          <input
            className="h-14 rounded-xl bg-white px-4 text-sm font-medium text-slate-700 shadow-md shadow-slate-300/70 outline-none transition focus:ring-2 focus:ring-primary/20"
            min={new Date().toISOString().split('T')[0]}
            onChange={(event) => {
              const nextCheckIn = event.target.value
              updateHotelFilters({
                checkIn: nextCheckIn,
                checkOut: nextCheckIn >= checkOut ? addDays(nextCheckIn, 1) : checkOut,
              })
            }}
            type="date"
            value={checkIn}
          />
          <input
            className="h-14 rounded-xl bg-white px-4 text-sm font-medium text-slate-700 shadow-md shadow-slate-300/70 outline-none transition focus:ring-2 focus:ring-primary/20"
            min={checkIn}
            onChange={(event) => updateHotelFilters({ checkOut: event.target.value })}
            type="date"
            value={checkOut}
          />
          <select
            className="h-14 rounded-xl bg-white px-4 text-sm font-medium text-slate-700 shadow-md shadow-slate-300/70 outline-none transition focus:ring-2 focus:ring-primary/20"
            onChange={(event) => updateHotelFilters({ guests: Number(event.target.value) })}
            value={guests}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
          <button
            className="grid h-14 place-items-center rounded-xl bg-primary px-7 text-base font-semibold text-white shadow-lg shadow-blue-300/70 transition hover:bg-blue-700"
            onClick={submitSearch}
            type="button"
          >
            Search
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold text-slate-900">Most Picked</h2>
        {isLoading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500">Loading properties...</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {highlights.map((item) => (
              <Link
                key={item.id}
                to={`/hotels/${buildHotelSlug(item.id, item.name)}`}
                className={`group relative overflow-hidden rounded-2xl ${item.tall ? 'h-full min-h-[420px] lg:row-span-2' : 'min-h-[200px]'}`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
                <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-5 py-2 text-sm font-medium text-white">
                  {item.price}
                </div>
                <div className="absolute bottom-5 left-5 text-white">
                  <p className="text-2xl font-medium">{item.name}</p>
                  <p className="text-sm text-white/80">{item.location}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">
            {superHostHotels.length > 0 ? 'Super Host Stays' : 'Popular Stays'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {superHostHotels.length > 0
              ? 'These properties belong to the most profitable and highest-rated hosts on the platform.'
              : 'A quick selection of approved stays from our catalog.'}
          </p>
        </div>
        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {featuredHotels.map((hotel) => (
          <article key={hotel.id} className="space-y-4">
            <div className="group relative overflow-hidden rounded-2xl">
              <img
                src={hotel.image}
                alt={hotel.name}
                className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-medium text-slate-900">{hotel.name}</h3>
                {superHostHotels.some((item) => item.id === hotel.id) ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                    Super Host
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-400">{hotel.location}</p>
              <Link
                className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline"
                to={`/hotels/${hotel.slug}`}
              >
                View details
              </Link>
            </div>
          </article>
        ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
