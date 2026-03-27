import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { hotels } from '../data/hotels'
import type { HotelCategory } from '../data/hotels'

const categories: Array<'All' | HotelCategory> = [
  'All',
  'Beach',
  'Mountain',
  'City',
  'Family',
  'Business',
  'Luxury',
]

const minPrice = 60
const maxPrice = 300

function HotelsPage() {
  const [search, setSearch] = useState('')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [category, setCategory] = useState<'All' | HotelCategory>('All')
  const [city, setCity] = useState('All')
  const [maxNightPrice, setMaxNightPrice] = useState(maxPrice)
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState('recommended')

  const cities = useMemo(() => ['All', ...new Set(hotels.map((hotel) => hotel.city))], [])

  const filteredHotels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return hotels
      .filter((hotel) => {
        const matchSearch =
          hotel.name.toLowerCase().includes(normalizedSearch) ||
          hotel.location.toLowerCase().includes(normalizedSearch)
        const matchCategory = category === 'All' || hotel.category === category
        const matchCity = city === 'All' || hotel.city === city
        const matchPrice = hotel.pricePerNight <= maxNightPrice
        const matchRating = hotel.rating >= minRating
        return matchSearch && matchCategory && matchCity && matchPrice && matchRating
      })
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
  }, [search, category, city, maxNightPrice, minRating, sortBy])

  const resetFilters = () => {
    setSearch('')
    setCategory('All')
    setCity('All')
    setMaxNightPrice(maxPrice)
    setMinRating(0)
    setSortBy('recommended')
  }

  return (
    <div className="section-container space-y-8 py-12 pb-16">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Hotels Catalog</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Find Your Perfect Stay</h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Search all available hotels and use advanced filters for exact matching.
        </p>

        <div className="mt-7 flex flex-col gap-3 md:flex-row">
          <input
            className="h-12 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or location"
            value={search}
          />
          <button
            className="h-12 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-primary transition hover:bg-blue-100"
            onClick={() => setIsAdvancedOpen((current) => !current)}
            type="button"
          >
            {isAdvancedOpen ? 'Hide Advanced Filters' : 'Open Advanced Filters'}
          </button>
        </div>

        {isAdvancedOpen ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
              <select
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                onChange={(event) => setCategory(event.target.value as 'All' | HotelCategory)}
                value={category}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</span>
              <select
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                onChange={(event) => setCity(event.target.value)}
                value={city}
              >
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sort by
              </span>
              <select
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary"
                onChange={(event) => setSortBy(event.target.value)}
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
                onChange={(event) => setMaxNightPrice(Number(event.target.value))}
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
                onChange={(event) => setMinRating(Number(event.target.value))}
                step={0.1}
                type="range"
                value={minRating}
              />
            </label>

            <div className="flex items-end">
              <button
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={resetFilters}
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

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredHotels.map((hotel) => (
          <article
            key={hotel.slug}
            className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200"
          >
            <div className="group relative">
              <img
                src={hotel.image}
                alt={hotel.name}
                className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {hotel.tag ? (
                <span className="absolute right-0 top-0 rounded-bl-xl bg-primary px-4 py-2 text-xs font-medium text-white">
                  {hotel.tag}
                </span>
              ) : null}
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-2xl font-medium text-slate-900">{hotel.name}</h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
                  {hotel.category}
                </span>
              </div>
              <p className="text-sm text-slate-500">{hotel.location}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">${hotel.pricePerNight}/night</span>
                <span className="text-amber-500">★ {hotel.rating}</span>
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

      {filteredHotels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No hotels found. Try changing search or filters.
        </div>
      ) : null}
    </div>
  )
}

export default HotelsPage
