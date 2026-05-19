import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyBookings, getOwnerBookings, updateBookingStatusRequest } from '../../api/bookings'
import { createOwnerProperty, createRoomForProperty, getOwnerProperties, getPropertyTypes } from '../../api/properties'
import { getMyReminders } from '../../api/reminders'
import {
  getVerificationRequests,
  submitVerificationRequestToApi,
} from '../../api/verification'
import { useAuth } from '../../context/AuthContext'
import { formatDateRange } from '../../context/BookingContext'
import { useUiStore } from '../../store/uiStore'
import type { OwnerDashboardTab } from '../../store/uiStore'

const tabItems: Array<{ id: OwnerDashboardTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'hotels', label: 'Hotel Management' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'messages', label: 'Message' },
  { id: 'settings', label: 'Setting' },
]

function OwnerDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const activeTab = useUiStore((state) => state.ownerDashboardTab)
  const setActiveTab = useUiStore((state) => state.setOwnerDashboardTab)
  const [hotelName, setHotelName] = useState('')
  const [hotelLocation, setHotelLocation] = useState('')
  const [hotelType, setHotelType] = useState('hotel')
  const [hotelDescription, setHotelDescription] = useState('')
  const [hotelPhotoUrl, setHotelPhotoUrl] = useState('')
  const [verificationComment, setVerificationComment] = useState('')
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [roomName, setRoomName] = useState('')
  const [roomCapacity, setRoomCapacity] = useState('2')
  const [roomPricePerUnit, setRoomPricePerUnit] = useState('120')
  const [roomIsActive, setRoomIsActive] = useState(true)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [ownerDecisionComment, setOwnerDecisionComment] = useState('')

  const { data: ownedHotels = [], isLoading: isLoadingHotels } = useQuery({
    enabled: Boolean(user?.email),
    queryKey: ['owner-properties', user?.email],
    queryFn: () => getOwnerProperties(user!.email),
  })
  const { data: propertyTypes = [] } = useQuery({
    queryKey: ['property-types'],
    queryFn: getPropertyTypes,
  })

  const { data: personalBookings = [] } = useQuery({
    enabled: Boolean(user),
    queryKey: ['dashboard-bookings', 'me'],
    queryFn: getMyBookings,
  })

  const { data: hotelBookings = [] } = useQuery({
    enabled: Boolean(user?.role === 'hotel_owner'),
    queryKey: ['dashboard-bookings', 'owner'],
    queryFn: getOwnerBookings,
  })

  const { data: ownerRequests = [] } = useQuery({
    enabled: Boolean(user?.role === 'hotel_owner'),
    queryKey: ['verification-requests', 'owner'],
    queryFn: getVerificationRequests,
  })

  const { data: reminders = [] } = useQuery({
    enabled: Boolean(user),
    queryKey: ['dashboard-reminders', 'me'],
    queryFn: getMyReminders,
  })

  const createHotelMutation = useMutation({
    mutationFn: () =>
      createOwnerProperty({
        name: hotelName.trim(),
        address: hotelLocation.trim(),
        description: hotelDescription.trim() || undefined,
        photoUrl: hotelPhotoUrl.trim() || undefined,
        propertyTypeName: hotelType,
      }),
    onSuccess: async (property) => {
      await submitVerificationRequestToApi({
        propertyId: property.id,
        comment: verificationComment.trim() || undefined,
      })
      setHotelName('')
      setHotelLocation('')
      setHotelType('hotel')
      setHotelDescription('')
      setHotelPhotoUrl('')
      setVerificationComment('')
      queryClient.invalidateQueries({ queryKey: ['owner-properties', user?.email] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['verification-requests', 'owner'] })
      queryClient.invalidateQueries({ queryKey: ['verification-requests', 'admin'] })
    },
  })

  const createRoomMutation = useMutation({
    mutationFn: () =>
      createRoomForProperty(selectedHotelId!, {
        name: roomName.trim(),
        capacity: Number(roomCapacity),
        pricePerUnit: Number(roomPricePerUnit),
        isActive: roomIsActive,
      }),
    onSuccess: () => {
      setSelectedHotelId(null)
      setRoomName('')
      setRoomCapacity('2')
      setRoomPricePerUnit('120')
      setRoomIsActive(true)
      queryClient.invalidateQueries({ queryKey: ['owner-properties', user?.email] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  const bookingDecisionMutation = useMutation({
    mutationFn: (payload: { bookingId: string; status: 'CONFIRMED' | 'CANCELLED' }) =>
      updateBookingStatusRequest(payload.bookingId, payload.status),
    onSuccess: () => {
      setSelectedBookingId(null)
      setOwnerDecisionComment('')
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'owner'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  const avgRating = useMemo(
    () =>
      ownedHotels.length
        ? (ownedHotels.reduce((sum, h) => sum + h.rating, 0) / ownedHotels.length).toFixed(1)
        : '0.0',
    [ownedHotels],
  )

  const addHotel = () => {
    if (!hotelName.trim() || !hotelLocation.trim() || !user) {
      return
    }

    createHotelMutation.mutate()
  }

  const selectedBooking = hotelBookings.find((booking) => booking.id === selectedBookingId) ?? null

  const addRoom = () => {
    if (!selectedHotelId || !roomName.trim()) {
      return
    }

    createRoomMutation.mutate()
  }

  const renderBookingCards = (
    bookings: typeof personalBookings,
    emptyLabel: string,
    showRenter = false,
  ) => (
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
            <div className="mt-2 flex flex-wrap gap-2">
              {!booking.isInactive && !showRenter ? (
                <button
                  className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-600"
                  onClick={() => bookingDecisionMutation.mutate({ bookingId: booking.id, status: 'CANCELLED' })}
                  type="button"
                >
                  Cancel Booking
                </button>
              ) : null}
              {!booking.isInactive && showRenter && booking.bookingStatus === 'pending' ? (
                <button
                  className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary"
                  onClick={() => setSelectedBookingId(booking.id)}
                  type="button"
                >
                  Review Booking
                </button>
              ) : null}
            </div>
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
              <p className="text-sm text-slate-500">Managed Hotels</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{ownedHotels.length}</p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Average Rating</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{avgRating}</p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Pending Requests</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {ownerRequests.filter((request) => request.status === 'pending').length}
              </p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Hotel Bookings</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{hotelBookings.length}</p>
            </article>
          </div>
          <div>
            <h3 className="mb-3 text-2xl font-semibold text-slate-900">My travel bookings</h3>
            {renderBookingCards(personalBookings, 'No travel bookings yet for this owner account.')}
          </div>
          <div>
            <h3 className="mb-3 text-2xl font-semibold text-slate-900">Bookings in my hotels</h3>
            {renderBookingCards(
              hotelBookings,
              'No guest reservations yet for your hotel portfolio.',
              true,
            )}
          </div>
        </div>
      )
    }

    if (activeTab === 'hotels') {
      return (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 text-base"
              onChange={(event) => setHotelName(event.target.value)}
              placeholder="New hotel name"
              value={hotelName}
            />
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 text-base"
              onChange={(event) => setHotelLocation(event.target.value)}
              placeholder="Location, City"
              value={hotelLocation}
            />
              <select
                className="h-11 rounded-xl border border-slate-200 px-4 text-base"
                onChange={(event) => setHotelType(event.target.value)}
                value={hotelType}
              >
                {(propertyTypes.length > 0 ? propertyTypes : ['hotel']).map((propertyType) => (
                  <option key={propertyType} value={propertyType}>
                    {propertyType}
                  </option>
                ))}
              </select>
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 text-base"
              onChange={(event) => setHotelPhotoUrl(event.target.value)}
              placeholder="Photo URL"
              type="url"
              value={hotelPhotoUrl}
            />
            <textarea
              className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 text-base md:col-span-2"
              onChange={(event) => setHotelDescription(event.target.value)}
              placeholder="Hotel description"
              value={hotelDescription}
            />
            <textarea
              className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-base md:col-span-2"
              onChange={(event) => setVerificationComment(event.target.value)}
              placeholder="Verification note for admin"
              value={verificationComment}
            />
            <button
              className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white md:col-span-2"
              onClick={addHotel}
              type="button"
            >
              {createHotelMutation.isPending ? 'Adding...' : 'Add Hotel and Send to Verification'}
            </button>
            {createHotelMutation.error ? (
              <p className="text-sm font-medium text-rose-600 md:col-span-2">
                {createHotelMutation.error instanceof Error
                  ? createHotelMutation.error.message
                  : 'Unable to create hotel right now.'}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoadingHotels ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 sm:col-span-2 xl:col-span-3">
                Loading your hotels...
              </div>
            ) : null}
            {ownedHotels.map((hotel) => (
              <article key={hotel.slug} className="overflow-hidden rounded-2xl border border-slate-200">
                <img alt={hotel.name} className="h-40 w-full object-cover" src={hotel.image} />
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{hotel.name}</p>
                    <p className="text-sm text-slate-500">{hotel.location}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-500">★ {hotel.rating.toFixed(1)}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        hotel.verificationStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : hotel.verificationStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {hotel.verificationStatus}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{hotel.rooms.length} rooms configured</p>
                  <p className="text-sm text-slate-500">
                    Verification is sent automatically when the hotel is created.
                  </p>
                  <button
                    className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary"
                    onClick={() => setSelectedHotelId(hotel.id)}
                    type="button"
                  >
                    Add Room
                  </button>
                </div>
              </article>
            ))}
            {!isLoadingHotels && ownedHotels.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 sm:col-span-2 xl:col-span-3">
                You have not added any hotels yet.
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-3 text-xl font-semibold text-slate-900">My verification requests</h3>
            <div className="space-y-3">
              {ownerRequests.map((request) => (
                <article key={request.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{request.propertyName}</p>
                      <p className="text-sm text-slate-500">{request.ownerComment || 'No note provided.'}</p>
                    </div>
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
                  </div>
                  {request.adminComment ? (
                    <p className="mt-3 text-sm text-slate-600">Admin comment: {request.adminComment}</p>
                  ) : null}
                </article>
              ))}
              {ownerRequests.length === 0 ? <p className="text-slate-500">No verification requests yet.</p> : null}
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'bookings') {
      return (
        <div className="space-y-4">
          <p className="text-slate-600">Your own travel bookings are listed below.</p>
          {renderBookingCards(personalBookings, 'No travel bookings yet for this owner account.')}
          <div className="pt-2">
            <p className="mb-3 text-slate-600">Guest bookings for your hotels.</p>
            {renderBookingCards(
              hotelBookings,
              'No guest reservations yet for your hotel portfolio.',
              true,
            )}
          </div>
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
            <h2 className="mb-5 text-4xl font-semibold text-slate-900">
              {tabItems.find((t) => t.id === activeTab)?.label}
            </h2>
            {content()}
          </div>
        </main>
      </div>

      {selectedHotelId ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-slate-900">Add Room</h3>
              <button className="text-sm font-semibold text-slate-500" onClick={() => setSelectedHotelId(null)} type="button">
                Close
              </button>
            </div>
            <div className="grid gap-3">
              <input
                className="h-11 rounded-xl border border-slate-200 px-4 text-base"
                onChange={(event) => setRoomName(event.target.value)}
                placeholder="Room name"
                value={roomName}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-4 text-base"
                min="1"
                onChange={(event) => setRoomCapacity(event.target.value)}
                placeholder="Capacity"
                type="number"
                value={roomCapacity}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-4 text-base"
                min="1"
                onChange={(event) => setRoomPricePerUnit(event.target.value)}
                placeholder="Price per unit"
                step="0.01"
                type="number"
                value={roomPricePerUnit}
              />
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input checked={roomIsActive} onChange={(event) => setRoomIsActive(event.target.checked)} type="checkbox" />
                Room is active
              </label>
              <button className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white" onClick={addRoom} type="button">
                {createRoomMutation.isPending ? 'Saving room...' : 'Save Room'}
              </button>
              {createRoomMutation.error ? (
                <p className="text-sm font-medium text-rose-600">
                  {createRoomMutation.error instanceof Error
                    ? createRoomMutation.error.message
                    : 'Unable to save room right now.'}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selectedBooking ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">Review Booking</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedBooking.renterName} requested {selectedBooking.roomName} at {selectedBooking.hotelName}
                </p>
              </div>
              <button
                className="text-sm font-semibold text-slate-500"
                onClick={() => {
                  setSelectedBookingId(null)
                  setOwnerDecisionComment('')
                }}
                type="button"
              >
                Close
              </button>
            </div>
            <textarea
              className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              onChange={(event) => setOwnerDecisionComment(event.target.value)}
              placeholder="Comment for your decision (UI note, status is stored in DB)"
              value={ownerDecisionComment}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => bookingDecisionMutation.mutate({ bookingId: selectedBooking.id, status: 'CONFIRMED' })}
                type="button"
              >
                Accept Booking
              </button>
              <button
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => bookingDecisionMutation.mutate({ bookingId: selectedBooking.id, status: 'CANCELLED' })}
                type="button"
              >
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default OwnerDashboardPage
