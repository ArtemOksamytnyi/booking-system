import { useQuery } from '@tanstack/react-query'
import { getMyBookings } from '../../api/bookings'
import { useAuth } from '../../context/AuthContext'
import { formatDateRange } from '../../context/BookingContext'
import { useUiStore } from '../../store/uiStore'
import type { UserDashboardTab } from '../../store/uiStore'

const tabItems: Array<{ id: UserDashboardTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'messages', label: 'Message' },
  { id: 'help', label: 'Help' },
  { id: 'settings', label: 'Setting' },
]

function UserDashboardPage() {
  const { user } = useAuth()
  const activeTab = useUiStore((state) => state.userDashboardTab)
  const setActiveTab = useUiStore((state) => state.setUserDashboardTab)

  const { data: bookings = [] } = useQuery({
    enabled: Boolean(user),
    queryKey: ['dashboard-bookings', 'me'],
    queryFn: getMyBookings,
  })

  const content = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Bookings</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{bookings.length}</p>
          </article>
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Nights</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {bookings.reduce((sum, item) => sum + item.days, 0)}
            </p>
          </article>
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Spent</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              ${bookings.reduce((sum, item) => sum + item.total, 0)}
            </p>
          </article>
        </div>
      )
    }

    if (activeTab === 'bookings') {
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-2xl border border-slate-300 p-3">
              <div className="relative overflow-hidden rounded-2xl">
                <img alt={booking.hotelName} className="h-52 w-full object-cover" src={booking.image} />
                <span className="absolute right-0 top-0 rounded-bl-xl bg-primary px-3 py-2 text-xs font-medium text-white">
                  ${Math.round(booking.total / booking.days)} per night
                </span>
              </div>
              <div className="space-y-1 p-2 text-slate-800">
                <p className="text-2xl font-semibold">{booking.hotelName}</p>
                <p className="text-base text-slate-500">{booking.location}</p>
                <p className="text-lg">{formatDateRange(booking.checkIn, booking.checkOut)}</p>
                <p className="text-lg">{booking.days} Days</p>
                <p className="text-lg">Guests: {booking.guests}</p>
                <p className="text-lg">Initial Payment ${booking.initialPayment}</p>
                <p className="text-xl font-semibold text-slate-900">Total Payment ${booking.total}</p>
              </div>
            </article>
          ))}
          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-xl text-slate-500 sm:col-span-2 xl:col-span-3">
              No bookings yet. Reserve any hotel to see bookings here.
            </div>
          ) : null}
        </div>
      )
    }

    if (activeTab === 'refunds') {
      return (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <article key={`refund-${booking.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">{booking.hotelName}</p>
                <p className="text-sm text-slate-500">Paid ${booking.total}</p>
              </div>
              <button className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary">
                Request Refund
              </button>
            </article>
          ))}
          {bookings.length === 0 ? <p className="text-slate-500">No refundable bookings.</p> : null}
        </div>
      )
    }

    if (activeTab === 'messages') {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold text-slate-900">Support</p>
            <p className="mt-1 text-sm text-slate-500">How can we help you with your booking today?</p>
          </div>
          <textarea className="h-32 w-full rounded-xl border border-slate-200 p-3" placeholder="Write a message to support..." />
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Send</button>
        </div>
      )
    }

    if (activeTab === 'help') {
      return (
        <div className="space-y-3">
          <article className="rounded-xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">How do I change my booking dates?</p>
            <p className="mt-1 text-sm text-slate-600">Open booking details and create a modification request.</p>
          </article>
          <article className="rounded-xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">How do refunds work?</p>
            <p className="mt-1 text-sm text-slate-600">Refund status appears in the Refund tab after request submission.</p>
          </article>
        </div>
      )
    }

    return (
      <div className="space-y-3 max-w-lg">
        <label className="grid gap-2">
          <span className="text-sm text-slate-500">Notification email</span>
          <input className="h-11 rounded-xl border border-slate-200 px-3" defaultValue={user?.email} />
        </label>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Save Settings</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ececec]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[220px_1fr]">
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
              <p className="text-3xl font-semibold text-slate-900">Hello, {user?.name || 'User'}</p>
              <p className="text-base text-slate-500">Have a nice day</p>
              <h1 className="mt-3 text-5xl font-semibold text-primary">{user?.name || 'User'}</h1>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-slate-900">{user?.name || 'User'}</p>
              <p className="text-base text-slate-500">User</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-4xl font-semibold text-slate-900">{tabItems.find((t) => t.id === activeTab)?.label}</h2>
              {activeTab === 'bookings' ? <p className="text-base text-slate-500">{bookings.length} items</p> : null}
            </div>
            {content()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default UserDashboardPage
