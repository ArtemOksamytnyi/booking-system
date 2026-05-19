import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllBookings, getMyBookings, updateBookingStatusRequest } from '../../api/bookings'
import { getMyReminders } from '../../api/reminders'
import { getUsers } from '../../api/users'
import {
  getVerificationRequests,
  reviewVerificationRequestInApi,
} from '../../api/verification'
import { useAuth, humanizeRole } from '../../context/AuthContext'
import { formatDateRange } from '../../context/BookingContext'
import { useUiStore } from '../../store/uiStore'
import type { AdminDashboardTab } from '../../store/uiStore'

const tabItems: Array<{ id: AdminDashboardTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'owners', label: 'Hotel Owners' },
  { id: 'bookings', label: 'Booking Details' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'refunds', label: 'Refund' },
  { id: 'messages', label: 'Message' },
  { id: 'help', label: 'Help' },
  { id: 'settings', label: 'Setting' },
]

function AdminDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const activeTab = useUiStore((state) => state.adminDashboardTab)
  const setActiveTab = useUiStore((state) => state.setAdminDashboardTab)
  const search = useUiStore((state) => state.adminSearch)
  const setSearch = useUiStore((state) => state.setAdminSearch)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [adminComment, setAdminComment] = useState('')

  const { data: users = [] } = useQuery({
    enabled: Boolean(user?.role === 'admin'),
    queryKey: ['admin-users'],
    queryFn: getUsers,
  })

  const { data: verificationRequests = [] } = useQuery({
    enabled: Boolean(user?.role === 'admin'),
    queryKey: ['verification-requests', 'admin'],
    queryFn: getVerificationRequests,
  })

  const { data: myBookings = [] } = useQuery({
    enabled: Boolean(user),
    queryKey: ['dashboard-bookings', 'me'],
    queryFn: getMyBookings,
  })

  const { data: allBookings = [] } = useQuery({
    enabled: Boolean(user?.role === 'admin'),
    queryKey: ['dashboard-bookings', 'all'],
    queryFn: getAllBookings,
  })

  const { data: reminders = [] } = useQuery({
    enabled: Boolean(user),
    queryKey: ['dashboard-reminders', 'me'],
    queryFn: getMyReminders,
  })

  const filteredUsers = useMemo(
    () =>
      users.filter((item) =>
        [item.name, item.email].some((value) => value.toLowerCase().includes(search.toLowerCase())),
      ),
    [users, search],
  )

  const ownerAccounts = useMemo(
    () =>
      users.filter(
        (item) =>
          item.role === 'hotel_owner' &&
          [item.name, item.email].some((value) => value.toLowerCase().includes(search.toLowerCase())),
      ),
    [users, search],
  )

  const filteredRequests = useMemo(
    () =>
      verificationRequests.filter((item) =>
        [item.ownerName, item.ownerEmail, item.propertyName].some((value) =>
          value.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [verificationRequests, search],
  )

  const selectedRequest = filteredRequests.find((item) => item.id === selectedRequestId) ?? null

  const reviewMutation = useMutation({
    mutationFn: async (status: 'approved' | 'rejected') => {
      if (!selectedRequest) {
        return
      }

      await reviewVerificationRequestInApi({
        requestId: selectedRequest.id,
        status: status === 'approved' ? 'APPROVED' : 'REJECTED',
        comment: adminComment.trim() || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests', 'admin'] })
      queryClient.invalidateQueries({ queryKey: ['verification-requests', 'owner'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] })
    },
  })

  const bookingStatusMutation = useMutation({
    mutationFn: (bookingId: string) => updateBookingStatusRequest(bookingId, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'owner'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedRequestId) {
      return
    }

    await reviewMutation.mutateAsync(status)
    setSelectedRequestId(null)
    setAdminComment('')
  }

  const renderBookingCards = (bookings: typeof myBookings, emptyLabel: string, showRenter = false) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {bookings.map((booking) => (
        <article
          key={booking.id}
          className={`rounded-2xl border p-3 transition ${
            booking.isInactive ? 'border-slate-200 bg-slate-100/80 opacity-70' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="relative overflow-hidden rounded-2xl">
            <img alt={booking.hotelName} className="h-44 w-full object-cover" src={booking.image} />
            <span className="absolute right-0 top-0 rounded-bl-xl bg-primary px-3 py-2 text-xs font-medium text-white">
              ${Math.round(booking.total / booking.days)} per night
            </span>
          </div>
          <div className="space-y-1 p-2 text-slate-800">
            <p className="text-xl font-semibold">{booking.hotelName}</p>
            <p className="text-sm text-slate-500">{booking.location}</p>
            <p className="text-base">{formatDateRange(booking.checkIn, booking.checkOut)}</p>
            <p className="text-base">{booking.days} Days</p>
            <p className="text-base">Room: {booking.roomName}</p>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Status: {booking.bookingStatus.replace('_', ' ')}
            </p>
            {showRenter && booking.renterName ? (
              <p className="text-base text-slate-600">Guest: {booking.renterName}</p>
            ) : null}
            <p className="text-lg font-semibold text-slate-900">Total Payment ${booking.total}</p>
            {!booking.isInactive ? (
              <button
                className="mt-2 rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-600"
                onClick={() => bookingStatusMutation.mutate(booking.id)}
                type="button"
              >
                Cancel Booking
              </button>
            ) : null}
          </div>
        </article>
      ))}
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 sm:col-span-2 xl:col-span-3">
          {emptyLabel}
        </div>
      ) : null}
    </div>
  )

  const content = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{users.length}</p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Hotel Owners</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{ownerAccounts.length}</p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Pending Verifications</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {verificationRequests.filter((item) => item.status === 'pending').length}
              </p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">My Bookings</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{myBookings.length}</p>
            </article>
          </div>
          <div>
            <h3 className="mb-3 text-2xl font-semibold text-slate-900">My travel bookings</h3>
            {renderBookingCards(myBookings, 'No personal bookings yet for this admin account.')}
          </div>
        </div>
      )
    }

    if (activeTab === 'users') {
      return (
        <div className="space-y-3">
          {filteredUsers.map((person) => (
            <article key={person.email} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="font-semibold text-slate-900">{person.name}</p>
                <p className="text-sm text-slate-500">{person.email}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
                {humanizeRole(person.role)}
              </span>
            </article>
          ))}
        </div>
      )
    }

    if (activeTab === 'owners') {
      return (
        <div className="space-y-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="bg-slate-100 text-base text-slate-500">
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Comment</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-100 text-base text-slate-700">
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{request.ownerName}</p>
                      <p className="text-sm text-slate-500">{request.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-4">{request.propertyName}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          request.status === 'pending'
                            ? 'bg-slate-200 text-slate-600'
                            : request.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">{new Date(request.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{request.ownerComment || '-'}</td>
                    <td className="px-4 py-4">
                      <button
                        className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary"
                        onClick={() => {
                          setSelectedRequestId(request.id)
                          setAdminComment(request.adminComment)
                        }}
                        type="button"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRequest ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {selectedRequest.ownerName} · {selectedRequest.propertyName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Owner note: {selectedRequest.ownerComment || 'No comment provided.'}
                  </p>
                </div>
                <button
                  className="text-sm font-semibold text-slate-500"
                  onClick={() => {
                    setSelectedRequestId(null)
                    setAdminComment('')
                  }}
                  type="button"
                >
                  Close
                </button>
              </div>

              <label className="mt-4 grid gap-2">
                <span className="text-sm font-medium text-slate-700">Admin comment</span>
                <textarea
                  className="h-28 rounded-xl border border-slate-200 p-3 outline-none transition focus:border-primary"
                  onChange={(event) => setAdminComment(event.target.value)}
                  placeholder="Add your verification note..."
                  value={adminComment}
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => void handleReview('approved')}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => void handleReview('rejected')}
                  type="button"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 text-xl font-semibold text-slate-900">Owner accounts</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {ownerAccounts.map((owner) => (
                <article key={owner.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{owner.name}</p>
                  <p className="text-sm text-slate-500">{owner.email}</p>
                  <p className="mt-2 text-sm text-slate-600">Role: {humanizeRole(owner.role)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'bookings') {
      return (
        <div className="space-y-4">
          <p className="text-slate-600">All bookings from the database are listed below.</p>
          {renderBookingCards(allBookings, 'No bookings in the system yet.', true)}
        </div>
      )
    }

    if (activeTab === 'reminders') {
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

    if (activeTab === 'refunds') {
      return <p className="text-slate-600">Refund management panel: approve or reject refund requests.</p>
    }

    if (activeTab === 'messages') {
      return <p className="text-slate-600">Message center for user and owner support communication.</p>
    }

    if (activeTab === 'help') {
      return <p className="text-slate-600">Admin help center with moderation and operation guides.</p>
    }

    return <p className="text-slate-600">System settings for permissions, notifications and business rules.</p>
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
              <p className="text-3xl font-semibold text-slate-900">Hello, {user?.name || 'Admin'}</p>
              <p className="text-base text-slate-500">Have a nice day</p>
              <h1 className="mt-3 text-5xl font-semibold text-primary">Admin Dashboard</h1>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-slate-900">{user?.name || 'Admin'}</p>
              <p className="text-base text-slate-500">Admin</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <input
                className="h-11 flex-1 rounded-xl bg-slate-100 px-4 text-base outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search owners, users or properties"
                value={search}
              />
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-4xl font-semibold text-slate-900">
                {tabItems.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>

            {content()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboardPage
