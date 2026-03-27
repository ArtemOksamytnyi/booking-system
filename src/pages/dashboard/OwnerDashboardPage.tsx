import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { hotels } from '../../data/hotels'

type OwnerTab = 'dashboard' | 'hotels' | 'bookings' | 'messages' | 'settings'

const tabItems: Array<{ id: OwnerTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'hotels', label: 'Hotel Management' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'messages', label: 'Message' },
  { id: 'settings', label: 'Setting' },
]

function OwnerDashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<OwnerTab>('hotels')
  const [hotelName, setHotelName] = useState('')

  const [ownedHotels, setOwnedHotels] = useState(() => hotels.slice(0, 4))

  const addHotel = () => {
    if (!hotelName.trim()) {
      return
    }

    const sample = hotels[Math.floor(Math.random() * hotels.length)]
    setOwnedHotels((current) => [
      {
        ...sample,
        slug: `${sample.slug}-${Date.now()}`,
        name: hotelName.trim(),
      },
      ...current,
    ])
    setHotelName('')
  }

  const removeHotel = (slug: string) => {
    setOwnedHotels((current) => current.filter((item) => item.slug !== slug))
  }

  const avgRating = useMemo(
    () => (ownedHotels.length ? (ownedHotels.reduce((sum, h) => sum + h.rating, 0) / ownedHotels.length).toFixed(1) : '0.0'),
    [ownedHotels],
  )

  const content = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Managed Hotels</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{ownedHotels.length}</p>
          </article>
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Average Rating</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{avgRating}</p>
          </article>
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Verification</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{user?.verificationStatus === 'verified' ? 'Verified' : 'Pending'}</p>
          </article>
        </div>
      )
    }

    if (activeTab === 'hotels') {
      return (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-base"
              onChange={(event) => setHotelName(event.target.value)}
              placeholder="New hotel name"
              value={hotelName}
            />
            <button className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white" onClick={addHotel} type="button">
              Add Hotel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ownedHotels.map((hotel) => (
              <article key={hotel.slug} className="overflow-hidden rounded-2xl border border-slate-200">
                <img alt={hotel.name} className="h-40 w-full object-cover" src={hotel.image} />
                <div className="space-y-2 p-3">
                  <p className="text-xl font-semibold text-slate-900">{hotel.name}</p>
                  <p className="text-sm text-slate-500">{hotel.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-500">★ {hotel.rating}</span>
                    <button className="text-sm font-semibold text-rose-600" onClick={() => removeHotel(hotel.slug)} type="button">
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )
    }

    if (activeTab === 'bookings') {
      return <p className="text-slate-600">Owner bookings panel: monitor reservations and occupancy.</p>
    }

    if (activeTab === 'messages') {
      return <p className="text-slate-600">Owner message center to communicate with guests and admin.</p>
    }

    return <p className="text-slate-600">Owner settings for payout account and hotel preferences.</p>
  }

  return (
    <div className="min-h-screen bg-[#ececec]">
      <div className="mx-auto grid min-h-screen max-w-[1700px] grid-cols-1 lg:grid-cols-[220px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-5 py-7">
          <p className="whitespace-nowrap text-3xl font-semibold leading-none text-primary">LankaStay.</p>
          <nav className="mt-8 space-y-4 text-xl text-slate-500">
            {tabItems.map((item) => (
              <button
                key={item.id}
                className={`block w-full text-left ${activeTab === item.id ? 'font-semibold text-primary' : ''}`}
                onClick={() => setActiveTab(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="space-y-6 px-6 py-7 md:px-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-3xl font-semibold text-slate-900">Hello, {user?.name || 'Owner'}</p>
              <p className="text-base text-slate-500">Have a nice day</p>
              <h1 className="mt-3 text-5xl font-semibold text-primary">Hotel Owner Dashboard</h1>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-slate-900">{user?.name || 'Owner'}</p>
              <p className="text-base text-slate-500">Hotel Owner</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5">
            <h2 className="mb-5 text-4xl font-semibold text-slate-900">{tabItems.find((t) => t.id === activeTab)?.label}</h2>
            {content()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default OwnerDashboardPage
