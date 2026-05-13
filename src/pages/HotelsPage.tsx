import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProperties } from '../api/properties'
import type { PropertyCategory } from '../types/hotel'
import { useUiStore } from '../store/uiStore'

const categories: Array<'All' | PropertyCategory> = ['All', 'hotel', 'villa', 'apartment', 'resort']

const minPrice = 60
const maxPrice = 400

const addDays = (date: string, offset: number) => {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + offset)
  return next.toISOString().split('T')[0]
}

const humanizeCategory = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

function HotelsPage() {
  const hotelFilters = useUiStore((state) => state.hotelFilters)
  const updateHotelFilters = useUiStore((state) => state.updateHotelFilters)
  const resetHotelFilters = useUiStore((state) => state.resetHotelFilters)
  const { search, isAdvancedOpen, category, city, checkIn, checkOut, guests, maxNightPrice, minRating, sortBy } =
    hotelFilters

  const queryFilters = useMemo(
    () => ({
      search,
      category,
      city,
      checkIn,
      checkOut,
      guests,
    }),
    [search, category, city, checkIn, checkOut, guests],
  )

  const { data: hotels = [], isLoading, isError } = useQuery({
    queryKey: ['properties', queryFilters],
    queryFn: () => getProperties(queryFilters),
  })

  const { data: locationHotels = [] } = useQuery({
    queryKey: ['properties', 'locations'],
    queryFn: () => getProperties(),
  })

  const cities = useMemo(
    () => ['All', ...new Set(locationHotels.map((hotel) => hotel.city))],
    [locationHotels],
  )

  const filteredHotels = useMemo(() => {
    return hotels
      .filter((hotel) => hotel.pricePerNight <= maxNightPrice && hotel.rating >= minRating)
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return a.pricePerNight - b.pricePerNight
        }

        if (sortBy === 'price-desc') {
          return b.pricePerNight - a.pricePerNight
        }

        if (sortBy === 'rating') {
          return b.rating - a.rating
        }

        return b.reviews - a.reviews
      })
  }, [hotels, maxNightPrice, minRating, sortBy])

  return (
    <div className="section-container space-y-8 py-12 pb-16">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Hotels Catalog</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Find Your Perfect Stay</h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Search all available hotels and use advanced filters for exact matching.
        </p>

        <div className="mt-7 grid gap-3 lg:grid-cols-[1fr_0.7fr_0.7fr_0.6fr_auto]">
          <select
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
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
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
            min={new Date().toISOString().split('T')[0]}
            onChange={(event) =>
              updateHotelFilters({
                checkIn: event.target.value,
                checkOut: event.target.value >= checkOut ? addDays(event.target.value, 1) : checkOut,
              })
            }
            type="date"
            value={checkIn}
          />
          <input
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
            min={checkIn}
            onChange={(event) => updateHotelFilters({ checkOut: event.target.value })}
            type="date"
            value={checkOut}
          />
          <select
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
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
            className="h-12 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-primary transition hover:bg-blue-100"
            onClick={() => updateHotelFilters({ isAdvancedOpen: !isAdvancedOpen })}
            type="button"
          >
            {isAdvancedOpen ? 'Hide Advanced Filters' : 'Open Advanced Filters'}
          </button>
        </div>

        {isAdvancedOpen ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
              <input
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                onChange={(event) => updateHotelFilters({ search: event.target.value })}
                placeholder="Search by name or description"
                value={search}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
              <select
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                onChange={(event) =>
                  updateHotelFilters({ category: event.target.value as 'All' | PropertyCategory })
                }
                value={category}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === 'All' ? item : humanizeCategory(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stay dates</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(event) =>
                    updateHotelFilters({
                      checkIn: event.target.value,
                      checkOut: event.target.value >= checkOut ? addDays(event.target.value, 1) : checkOut,
                    })
                  }
                  type="date"
                  value={checkIn}
                />
                <input
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                  min={checkIn}
                  onChange={(event) => updateHotelFilters({ checkOut: event.target.value })}
                  type="date"
                  value={checkOut}
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sort by
              </span>
              <select
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                onChange={(event) =>
                  updateHotelFilters({
                    sortBy: event.target.value as 'recommended' | 'rating' | 'price-asc' | 'price-desc',
                  })
                }
                value={sortBy}
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Top Rating</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Max Price: ${maxNightPrice}
              </span>
              <input
                className="accent-primary"
                max={maxPrice}
                min={minPrice}
                onChange={(event) => updateHotelFilters({ maxNightPrice: Number(event.target.value) })}
                type="range"
                value={maxNightPrice}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Min Rating: {minRating.toFixed(1)}+
              </span>
              <input
                className="accent-primary"
                max={5}
                min={0}
                onChange={(event) => updateHotelFilters({ minRating: Number(event.target.value) })}
                step={0.1}
                type="range"
                value={minRating}
              />
            </label>

            <div className="flex items-end">
              <button
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={resetHotelFilters}
                type="button"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredHotels.length}</span> hotels
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading hotels...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-600">
          Unable to load hotels from the database.
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredHotels.map((hotel) => (
            <article
              key={hotel.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200"
            >
              <div className="group relative">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-2xl font-medium text-slate-900">{hotel.name}</h2>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
                    {humanizeCategory(hotel.category)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{hotel.location}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">${hotel.pricePerNight}/night</span>
                  <span className="text-amber-500">★ {hotel.rating.toFixed(1)}</span>
                </div>
                <Link
                  className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  to={`/hotels/${hotel.slug}`}
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {!isLoading && !isError && filteredHotels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No hotels found. Try changing search or filters.
        </div>
      ) : null}
    </div>
  )
}

export default HotelsPage
