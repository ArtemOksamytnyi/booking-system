import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyBookings, updateBookingStatusRequest, type DashboardBooking } from '../../api/bookings'
import { createPaymentRequest } from '../../api/payments'
import { getMyReminders } from '../../api/reminders'
import RemainingPaymentModal, { type RemainingPaymentMethod } from '../../components/RemainingPaymentModal'
import { useAuth } from '../../context/AuthContext'
import { formatDateRange } from '../../context/BookingContext'
import { useUiStore } from '../../store/uiStore'
import type { UserDashboardTab } from '../../store/uiStore'

const tabItems: Array<{ id: UserDashboardTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'reminders', label: 'Reminders' },
]

function UserDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const activeTab = useUiStore((state) => state.userDashboardTab)
  const setActiveTab = useUiStore((state) => state.setUserDashboardTab)
  const selectedTab = tabItems.some((item) => item.id === activeTab) ? activeTab : 'bookings'
  const [paymentBooking, setPaymentBooking] = useState<DashboardBooking | null>(null)

  const { data: bookings = [] } = useQuery({
    enabled: Boolean(user),
    queryKey: ['dashboard-bookings', 'me'],
    queryFn: getMyBookings,
  })

  const { data: reminders = [] } = useQuery({
    enabled: Boolean(user),
    queryKey: ['dashboard-reminders', 'me'],
    queryFn: getMyReminders,
  })

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => updateBookingStatusRequest(bookingId, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'owner'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  const topUpMutation = useMutation({
    mutationFn: ({ booking, paymentMethod }: { booking: DashboardBooking; paymentMethod: RemainingPaymentMethod }) =>
      createPaymentRequest({
        bookingId: Number(booking.id),
        amount: booking.remainingAmount,
        paymentMethod,
      }),
    onSuccess: () => {
      setPaymentBooking(null)
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-reminders', 'me'] })
    },
  })

  const content = () => {
    if (selectedTab === 'dashboard') {
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

    if (selectedTab === 'bookings') {
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className={`rounded-2xl border p-3 transition ${
                booking.isInactive ? 'border-slate-200 bg-slate-100/80 opacity-70' : 'border-slate-300 bg-white'
              }`}
            >
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
                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  Status: {booking.bookingStatus.replace('_', ' ')}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                  <span>Payment: {booking.paymentStatus.replace('_', ' ')}</span>
                  {booking.paymentStatus === 'partially_paid' && booking.remainingAmount > 0 && !booking.isInactive ? (
                    <button
                      className="rounded-full border border-primary px-2 py-1 text-[11px] font-semibold text-primary"
                      onClick={() => setPaymentBooking(booking)}
                      type="button"
                    >
                      Pay remaining ${booking.remainingAmount}
                    </button>
                  ) : null}
                </div>
                <p className="text-sm text-slate-500">
                  Paid ${booking.paidAmount} · Remaining ${booking.remainingAmount}
                </p>
                <p className="text-lg">Initial Payment ${booking.initialPayment}</p>
                <p className="text-xl font-semibold text-slate-900">Total Payment ${booking.total}</p>
                {!booking.isInactive ? (
                  <button
                    className="mt-2 rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-600"
                    onClick={() => cancelMutation.mutate(booking.id)}
                    type="button"
                  >
                    Cancel Booking
                  </button>
                ) : null}
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

    if (selectedTab === 'reminders') {
      return (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <article key={reminder.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{reminder.hotelName}</p>
              <p className="text-sm text-slate-500">{reminder.location}</p>
              <p className="mt-2 text-sm text-slate-600">
                Room: {reminder.roomName} · Checkout: {reminder.checkOut}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Reminder time: {new Date(reminder.remindAt).toLocaleString('en-GB')}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {reminder.isSent ? 'Reminder is active' : 'Upcoming reminder'}
              </p>
            </article>
          ))}
          {reminders.length === 0 ? <p className="text-slate-500">No reminders yet.</p> : null}
        </div>
      )
    }

    return null
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
                className={`block w-full text-left ${selectedTab === item.id ? 'font-semibold text-primary' : ''}`}
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
              <h2 className="text-4xl font-semibold text-slate-900">{tabItems.find((t) => t.id === selectedTab)?.label}</h2>
              {selectedTab === 'bookings' ? <p className="text-base text-slate-500">{bookings.length} items</p> : null}
            </div>
            {content()}
          </div>
        </main>
      </div>
      {paymentBooking ? (
        <RemainingPaymentModal
          amount={paymentBooking.remainingAmount}
          error={topUpMutation.error?.message}
          hotelName={paymentBooking.hotelName}
          isPending={topUpMutation.isPending}
          onClose={() => setPaymentBooking(null)}
          onSubmit={(paymentMethod) => topUpMutation.mutate({ booking: paymentBooking, paymentMethod })}
        />
      ) : null}
    </div>
  )
}

export default UserDashboardPage
