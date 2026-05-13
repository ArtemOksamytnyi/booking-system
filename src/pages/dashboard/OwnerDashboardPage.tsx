import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyBookings, getOwnerBookings } from '../../api/bookings'
import { createOwnerProperty, getOwnerProperties } from '../../api/properties'
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
  const [hotelType, setHotelType] = useState<'hotel' | 'villa' | 'apartment' | 'resort'>('hotel')
  const [hotelDescription, setHotelDescription] = useState('')
  const [hotelPhotoUrl, setHotelPhotoUrl] = useState('')
  const [verificationComment, setVerificationComment] = useState('')

  const { data: ownedHotels = [], isLoading: isLoadingHotels } = useQuery({
    enabled: Boolean(user?.email),
    queryKey: ['owner-properties', user?.email],
    queryFn: () => getOwnerProperties(user!.email),
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

  const renderBookingCards = (
    bookings: typeof personalBookings,
    emptyLabel: string,
    showRenter = false,
  ) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {bookings.map((booking) => (
        <article key={booking.id} className="rounded-2xl border border-slate-200 p-3">
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
            {showRenter && booking.renterName ? (
              <p className="text-base text-slate-600">Guest: {booking.renterName}</p>
            ) : null}
            <p className="text-lg font-semibold text-slate-900">Total Payment ${booking.total}</p>
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
              onChange={(event) =>
                setHotelType(event.target.value as 'hotel' | 'villa' | 'apartment' | 'resort')
              }
              value={hotelType}
            >
              <option value="hotel">Hotel</option>
              <option value="villa">Villa</option>
              <option value="apartment">Apartment</option>
              <option value="resort">Resort</option>
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
                  <p className="text-sm text-slate-500">
                    Verification is sent automatically when the hotel is created.
                  </p>
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
    </div>
  )
}

export default OwnerDashboardPage
