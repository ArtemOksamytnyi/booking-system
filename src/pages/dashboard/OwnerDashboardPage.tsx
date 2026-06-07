import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyBookings, getOwnerBookings, updateBookingStatusRequest, type DashboardBooking } from '../../api/bookings'
import { createPaymentRequest } from '../../api/payments'
import {
  createOwnerProperty,
  createRoomForProperty,
  getOwnerProperties,
  getPropertyTypes,
  removeOrDeactivateOwnerProperty,
  removeOrDeactivateRoomForProperty,
  updateOwnerProperty,
  updateRoomForProperty,
} from '../../api/properties'
import { getMyReminders } from '../../api/reminders'
import { getVerificationRequests } from '../../api/verification'
import { getMyOwnerAnalytics } from '../../api/users'
import RemainingPaymentModal, { type RemainingPaymentMethod } from '../../components/RemainingPaymentModal'
import { useAuth } from '../../context/AuthContext'
import { formatDateRange } from '../../context/BookingContext'
import { useUiStore } from '../../store/uiStore'
import type { OwnerDashboardTab } from '../../store/uiStore'

const tabItems: Array<{ id: OwnerDashboardTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'hotels', label: 'Hotel Management' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'reminders', label: 'Reminders' },
]

const hotelsPerPage = 6

function OwnerDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const activeTab = useUiStore((state) => state.ownerDashboardTab)
  const setActiveTab = useUiStore((state) => state.setOwnerDashboardTab)
  const selectedTab = tabItems.some((item) => item.id === activeTab) ? activeTab : 'hotels'
  const [hotelName, setHotelName] = useState('')
  const [hotelLocation, setHotelLocation] = useState('')
  const [hotelType, setHotelType] = useState('hotel')
  const [hotelDescription, setHotelDescription] = useState('')
  const [hotelPhotoUrl, setHotelPhotoUrl] = useState('')
  const [verificationComment, setVerificationComment] = useState('')
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [editingHotelId, setEditingHotelId] = useState<number | null>(null)
  const [roomName, setRoomName] = useState('')
  const [roomCapacity, setRoomCapacity] = useState('2')
  const [roomPricePerUnit, setRoomPricePerUnit] = useState('120')
  const [roomIsActive, setRoomIsActive] = useState(true)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [paymentBooking, setPaymentBooking] = useState<DashboardBooking | null>(null)
  const [ownerDecisionComment, setOwnerDecisionComment] = useState('')
  const [expandedHotels, setExpandedHotels] = useState<Record<number, boolean>>({})
  const [hotelPage, setHotelPage] = useState(1)

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
  const { data: ownerAnalytics } = useQuery({
    enabled: Boolean(user?.role === 'hotel_owner'),
    queryKey: ['owner-analytics', user?.id],
    queryFn: getMyOwnerAnalytics,
  })

  const createHotelMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: hotelName.trim(),
        address: hotelLocation.trim(),
        description: hotelDescription.trim() || undefined,
        photoUrl: hotelPhotoUrl.trim() || undefined,
        propertyTypeName: hotelType,
        verificationComment: verificationComment.trim() || undefined,
      }

      return editingHotelId
        ? updateOwnerProperty(editingHotelId, payload)
        : createOwnerProperty(payload)
    },
    onSuccess: () => {
      setHotelName('')
      setHotelLocation('')
      setHotelType('hotel')
      setHotelDescription('')
      setHotelPhotoUrl('')
      setVerificationComment('')
      setEditingHotelId(null)
      queryClient.invalidateQueries({ queryKey: ['owner-properties', user?.email] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['verification-requests', 'owner'] })
      queryClient.invalidateQueries({ queryKey: ['verification-requests', 'admin'] })
      queryClient.invalidateQueries({ queryKey: ['owner-analytics', user?.id] })
    },
  })

  const createRoomMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: roomName.trim(),
        capacity: Number(roomCapacity),
        pricePerUnit: Number(roomPricePerUnit),
        isActive: roomIsActive,
      }

      return editingRoomId
        ? updateRoomForProperty(editingRoomId, payload)
        : createRoomForProperty(selectedHotelId!, payload)
    },
    onSuccess: () => {
      setSelectedHotelId(null)
      setEditingRoomId(null)
      setRoomName('')
      setRoomCapacity('2')
      setRoomPricePerUnit('120')
      setRoomIsActive(true)
      queryClient.invalidateQueries({ queryKey: ['owner-properties', user?.email] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['owner-analytics', user?.id] })
    },
  })

  const removeHotelMutation = useMutation({
    mutationFn: (payload: { propertyId: number; action: 'delete' | 'deactivate' | 'activate' | 'cancel_pending' }) =>
      removeOrDeactivateOwnerProperty(payload.propertyId, payload.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties', user?.email] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'owner'] })
      queryClient.invalidateQueries({ queryKey: ['owner-analytics', user?.id] })
    },
  })

  const removeRoomMutation = useMutation({
    mutationFn: (payload: { roomId: number; action: 'delete' | 'deactivate' | 'activate' | 'cancel_pending' }) =>
      removeOrDeactivateRoomForProperty(payload.roomId, payload.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties', user?.email] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', 'owner'] })
      queryClient.invalidateQueries({ queryKey: ['owner-analytics', user?.id] })
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
      queryClient.invalidateQueries({ queryKey: ['owner-analytics', user?.id] })
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

  const avgRating = useMemo(
    () =>
      ownedHotels.length
        ? (ownedHotels.reduce((sum, h) => sum + h.rating, 0) / ownedHotels.length).toFixed(1)
        : '0.0',
    [ownedHotels],
  )
  const hotelPageCount = Math.max(1, Math.ceil(ownedHotels.length / hotelsPerPage))
  const hotelCurrentPage = Math.min(hotelPage, hotelPageCount)
  const visibleHotels = ownedHotels.slice((hotelCurrentPage - 1) * hotelsPerPage, hotelCurrentPage * hotelsPerPage)

  const addHotel = () => {
    if (!hotelName.trim() || !hotelLocation.trim() || !user) {
      return
    }

    createHotelMutation.mutate()
  }

  const editHotel = (hotel: (typeof ownedHotels)[number]) => {
    setEditingHotelId(hotel.id)
    setHotelName(hotel.name)
    setHotelLocation(hotel.location)
    setHotelType(hotel.category)
    setHotelDescription(hotel.description)
    setHotelPhotoUrl(hotel.image)
    setVerificationComment('')
  }

  const selectedBooking = hotelBookings.find((booking) => booking.id === selectedBookingId) ?? null

  const addRoom = () => {
    if (!selectedHotelId || !roomName.trim()) {
      return
    }

    createRoomMutation.mutate()
  }

  const editRoom = (hotelId: number, room: (typeof ownedHotels)[number]['rooms'][number]) => {
    setSelectedHotelId(hotelId)
    setEditingRoomId(room.id)
    setRoomName(room.name)
    setRoomCapacity(String(room.capacity))
    setRoomPricePerUnit(String(room.pricePerNight))
    setRoomIsActive(room.isActive)
  }

  const toggleRoomsVisibility = (hotelId: number) => {
    setExpandedHotels((current) => ({
      ...current,
      [hotelId]: !current[hotelId],
    }))
  }

  const askPropertyAction = (propertyId: number) => {
    const hotel = ownedHotels.find((item) => item.id === propertyId)

    if (!hotel) {
      return
    }

    const action = hotel.isActive
      ? window.prompt('Type one action: delete, deactivate, cancel_pending')
      : window.prompt('Type one action: activate or delete')

    if (
      action === 'delete' ||
      action === 'deactivate' ||
      action === 'activate' ||
      action === 'cancel_pending'
    ) {
      removeHotelMutation.mutate(
        { propertyId, action },
        {
          onError: (error) => {
            window.alert(error instanceof Error ? error.message : 'Unable to manage this hotel.')
          },
        },
      )
    }
  }

  const askRoomAction = (roomId: number) => {
    const room = ownedHotels.flatMap((hotel) => hotel.rooms).find((item) => item.id === roomId)

    if (!room) {
      return
    }

    const action = room.isActive
      ? window.prompt('Type one action: delete, deactivate, cancel_pending')
      : window.prompt('Type one action: activate or delete')

    if (
      action === 'delete' ||
      action === 'deactivate' ||
      action === 'activate' ||
      action === 'cancel_pending'
    ) {
      removeRoomMutation.mutate(
        { roomId, action },
        {
          onError: (error) => {
            window.alert(error instanceof Error ? error.message : 'Unable to manage this room.')
          },
        },
      )
    }
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
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-slate-500">
              <span>Payment: {booking.paymentStatus.replace('_', ' ')}</span>
              {!showRenter && booking.paymentStatus === 'partially_paid' && booking.remainingAmount > 0 && !booking.isInactive ? (
                <button
                  className="rounded-full border border-primary px-2 py-1 text-[11px] font-semibold text-primary"
                  onClick={() => setPaymentBooking(booking)}
                  type="button"
                >
                  Pay remaining ${booking.remainingAmount}
                </button>
              ) : null}
            </div>
            {!showRenter ? (
              <p className="text-sm text-slate-500">
                Paid ${booking.paidAmount} · Remaining ${booking.remainingAmount}
              </p>
            ) : null}
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
    if (selectedTab === 'dashboard') {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Managed Hotels</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{ownedHotels.length}</p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Average Rating</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{ownerAnalytics?.averageRating ?? avgRating}</p>
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
          <div className="rounded-2xl bg-blue-50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-slate-900">
                Total owner income: ${ownerAnalytics?.totalIncome?.toFixed?.(2) ?? '0.00'}
              </p>
              {ownerAnalytics?.isSuperHost ? (
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                  Супергосподар
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Owners with income above $1000 are tracked for platform recommendations.
            </p>
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

    if (selectedTab === 'hotels') {
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
              {createHotelMutation.isPending
                ? 'Saving...'
                : editingHotelId
                  ? 'Save Hotel Changes'
                  : 'Add Hotel and Send to Verification'}
            </button>
            {editingHotelId ? (
              <button
                className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 md:col-span-2"
                onClick={() => {
                  setEditingHotelId(null)
                  setHotelName('')
                  setHotelLocation('')
                  setHotelType(propertyTypes[0] ?? 'hotel')
                  setHotelDescription('')
                  setHotelPhotoUrl('')
                  setVerificationComment('')
                }}
                type="button"
              >
                Cancel Editing
              </button>
            ) : null}
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
            {visibleHotels.map((hotel) => (
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
                  {!hotel.isActive ? (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                      inactive
                    </span>
                  ) : null}
                  <p className="text-sm text-slate-500">{hotel.rooms.length} rooms configured</p>
                  <p className="text-sm text-slate-500">
                    Verification is sent automatically when the hotel is created.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary"
                      onClick={() => setSelectedHotelId(hotel.id)}
                      type="button"
                    >
                      Add Room
                    </button>
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                      onClick={() => editHotel(hotel)}
                      type="button"
                    >
                      Edit Hotel
                    </button>
                    <button
                      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                        hotel.isActive
                          ? 'border border-rose-300 text-rose-600'
                          : 'border border-emerald-300 text-emerald-700'
                      }`}
                      onClick={() => askPropertyAction(hotel.id)}
                      type="button"
                    >
                      {hotel.isActive ? 'Remove / Deactivate' : 'Activate / Remove'}
                    </button>
                  </div>
                  {hotel.rooms.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      {hotel.rooms
                        .slice(0, expandedHotels[hotel.id] ? hotel.rooms.length : 3)
                        .map((room) => (
                        <div key={room.id} className="rounded-xl bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {room.name} · ${room.pricePerNight}
                              </p>
                              <p className="text-sm text-slate-500">
                                Capacity {room.capacity} · {room.isActive ? 'active' : 'inactive'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                                onClick={() => editRoom(hotel.id, room)}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                                  room.isActive
                                    ? 'border border-rose-300 text-rose-600'
                                    : 'border border-emerald-300 text-emerald-700'
                                }`}
                                onClick={() => askRoomAction(room.id)}
                                type="button"
                              >
                                {room.isActive ? 'Remove / Deactivate' : 'Activate / Remove'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {hotel.rooms.length > 3 ? (
                        <button
                          className="text-sm font-semibold text-primary hover:underline"
                          onClick={() => toggleRoomsVisibility(hotel.id)}
                          type="button"
                        >
                          {expandedHotels[hotel.id] ? 'Show less' : `Show all (${hotel.rooms.length})`}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
            {!isLoadingHotels && ownedHotels.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 sm:col-span-2 xl:col-span-3">
                You have not added any hotels yet.
              </div>
            ) : null}
          </div>
          {ownedHotels.length > hotelsPerPage ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">
                Showing {(hotelCurrentPage - 1) * hotelsPerPage + 1}-
                {Math.min(hotelCurrentPage * hotelsPerPage, ownedHotels.length)} of {ownedHotels.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={hotelCurrentPage === 1}
                  onClick={() => setHotelPage((page) => Math.max(1, page - 1))}
                  type="button"
                >
                  Previous
                </button>
                <span className="min-w-20 text-center text-sm font-semibold text-slate-700">
                  {hotelCurrentPage} / {hotelPageCount}
                </span>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={hotelCurrentPage === hotelPageCount}
                  onClick={() => setHotelPage((page) => Math.min(hotelPageCount, page + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

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

    if (selectedTab === 'bookings') {
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
      <div className="mx-auto grid min-h-screen max-w-[1700px] grid-cols-1 lg:grid-cols-[220px_1fr]">
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
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-3xl font-semibold text-slate-900">Hello, {user?.name || 'Owner'}</p>
                {ownerAnalytics?.isSuperHost ? (
                  <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                    Супергосподар
                  </span>
                ) : null}
              </div>
              <p className="text-base text-slate-500">Have a nice day</p>
              <h1 className="mt-3 text-5xl font-semibold text-primary">Hotel Owner Dashboard</h1>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-slate-900">{user?.name || 'Owner'}</p>
              <p className="text-base text-slate-500">
                Hotel Owner{ownerAnalytics?.isSuperHost ? ' · Супергосподар' : ''}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5">
            <h2 className="mb-5 text-4xl font-semibold text-slate-900">
              {tabItems.find((t) => t.id === selectedTab)?.label}
            </h2>
            {content()}
          </div>
        </main>
      </div>

      {selectedHotelId ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-slate-900">
                {editingRoomId ? 'Edit Room' : 'Add Room'}
              </h3>
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
                {createRoomMutation.isPending
                  ? 'Saving room...'
                  : editingRoomId
                    ? 'Save Room Changes'
                    : 'Save Room'}
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
