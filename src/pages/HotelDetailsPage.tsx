import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { createPropertyReview, getAvailableRooms, getProperties, getPropertyById, getPropertyIdFromSlug } from '../api/properties'
import { useAuth } from '../context/AuthContext'
import { useBooking } from '../context/BookingContext'
import type { Hotel } from '../types/hotel'

const getDateOffset = (offset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

const addDays = (date: string, offset: number) => {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + offset)
  return next.toISOString().split('T')[0]
}

type HotelDetailsContentProps = {
  hotel: Hotel
}

function HotelDetailsContent({ hotel }: HotelDetailsContentProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { startDraft } = useBooking()
  const [checkIn, setCheckIn] = useState(getDateOffset(1))
  const [checkOut, setCheckOut] = useState(getDateOffset(3))
  const [guests, setGuests] = useState(2)
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState('5')
  const [reviewComment, setReviewComment] = useState('')
  const { data: allHotels = [] } = useQuery({
    queryKey: ['properties', 'details-similar'],
    queryFn: () => getProperties(),
  })

  const availableRoomsQuery = useQuery({
    queryKey: ['available-rooms', hotel.id, checkIn, checkOut, guests],
    queryFn: () => getAvailableRooms(hotel.id, { checkIn, checkOut, guests }),
    enabled: isRoomsModalOpen,
  })

  const similarHotels = allHotels.filter((item) => item.id !== hotel.id).slice(0, 3)
  const days = useMemo(() => {
    const start = new Date(`${checkIn}T00:00:00`).getTime()
    const end = new Date(`${checkOut}T00:00:00`).getTime()
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24))
    return Math.max(diff, 1)
  }, [checkIn, checkOut])

  const total = days * hotel.pricePerNight

  const reviewMutation = useMutation({
    mutationFn: () =>
      createPropertyReview(hotel.id, {
        rating: Number(reviewRating),
        comment: reviewComment.trim() || undefined,
      }),
    onSuccess: async () => {
      setReviewComment('')
      setReviewRating('5')
      await queryClient.invalidateQueries({ queryKey: ['property', hotel.id] })
    },
  })

  const onOpenRooms = () => {
    setIsRoomsModalOpen(true)
  }

  const onSelectRoom = (roomId: number) => {
    const selectedRoom = availableRoomsQuery.data?.rooms.find((room) => room.id === roomId)
    if (!selectedRoom) {
      return
    }

    startDraft({
      propertyId: hotel.id,
      hotelSlug: hotel.slug,
      hotelName: hotel.name,
      location: hotel.location,
      image: hotel.image,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      roomPricePerNight: selectedRoom.pricePerNight,
      checkIn,
      checkOut,
      guests,
    })
    setIsRoomsModalOpen(false)
    navigate(`/booking/${hotel.slug}`)
  }

  const onSubmitReview = async () => {
    if (!user) {
      navigate('/hotels')
      return
    }

    await reviewMutation.mutateAsync()
  }

  return (
    <div className="section-container space-y-10 py-12 pb-16">
      <Link className="inline-flex text-sm font-medium text-primary hover:underline" to="/hotels">
        ← Back to catalog
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="overflow-hidden rounded-3xl bg-white shadow-sm shadow-slate-200">
          <img alt={hotel.name} className="h-[360px] w-full object-cover" src={hotel.image} />
          <div className="space-y-5 p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-primary">
                {hotel.category}
              </span>
              <span className="text-sm text-slate-500">{hotel.location}</span>
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">{hotel.name}</h1>
            <div className="flex items-center gap-6 text-sm">
              <span className="font-semibold text-amber-500">★ {hotel.rating.toFixed(1)}</span>
              <span className="text-slate-500">{hotel.reviews} reviews</span>
              <span className="font-semibold text-slate-800">${hotel.pricePerNight}/night</span>
            </div>
            <p className="text-slate-600">{hotel.description}</p>
          </div>
        </article>

        <aside className="space-y-4 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Book this hotel</h2>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Check-in</span>
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              onChange={(event) => {
                const nextCheckIn = event.target.value
                const currentCheckOut = new Date(`${checkOut}T00:00:00`).getTime()
                const nextCheckInTime = new Date(`${nextCheckIn}T00:00:00`).getTime()

                setCheckIn(nextCheckIn)
                if (nextCheckInTime >= currentCheckOut) {
                  setCheckOut(addDays(nextCheckIn, 1))
                }
              }}
              type="date"
              value={checkIn}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Check-out</span>
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              min={checkIn}
              onChange={(event) => setCheckOut(event.target.value)}
              type="date"
              value={checkOut}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guests</span>
            <select
              className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              onChange={(event) => setGuests(Number(event.target.value))}
              value={guests}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>{`${value} Guest${value > 1 ? 's' : ''}`}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">{days}</span> days
            </p>
            <p className="mt-1">
              From: <span className="font-semibold text-slate-900">${total}</span>
            </p>
          </div>

          <button
            className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-blue-700"
            onClick={onOpenRooms}
            type="button"
          >
            Check Available Rooms
          </button>
        </aside>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-3xl bg-white p-7 shadow-sm shadow-slate-200">
          <h2 className="text-3xl font-semibold text-slate-900">Available Room Types</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {hotel.rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                {room.name} · up to {room.capacity} guests · ${room.pricePerNight}/night
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-7 shadow-sm shadow-slate-200">
          <h2 className="text-3xl font-semibold text-slate-900">Hotel Snapshot</h2>
          <div className="mt-5 grid gap-3">
            <img
              alt={hotel.name}
              className="h-48 w-full rounded-xl object-cover"
              src={hotel.image}
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>{hotel.description}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-3xl bg-white p-7 shadow-sm shadow-slate-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold text-slate-900">Guest Reviews</h2>
            <span className="text-sm text-slate-500">{hotel.reviewItems?.length ?? 0} entries</span>
          </div>

          <div className="mt-5 space-y-4">
            {(hotel.reviewItems?.length ?? 0) > 0 ? (
              hotel.reviewItems?.map((review) => (
                <article key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">{review.authorName}</p>
                    <span className="text-sm font-semibold text-amber-500">★ {review.rating}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{review.comment || 'No comment left.'}</p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-slate-500">
                No reviews yet. Be the first guest to leave feedback.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-7 shadow-sm shadow-slate-200">
          <h2 className="text-3xl font-semibold text-slate-900">Leave a Review</h2>
          <div className="mt-5 space-y-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</span>
              <select
                className="h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
                onChange={(event) => setReviewRating(event.target.value)}
                value={reviewRating}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comment</span>
              <textarea
                className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Share a few words about the stay..."
                value={reviewComment}
              />
            </label>

            {user ? (
              <button
                className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-blue-700"
                onClick={() => void onSubmitReview()}
                type="button"
              >
                {reviewMutation.isPending ? 'Saving review...' : 'Submit Review'}
              </button>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Login to leave a review for this hotel.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold text-slate-900">Similar Hotels</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {similarHotels.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200">
              <img alt={item.name} className="h-44 w-full object-cover" src={item.image} />
              <div className="space-y-2 p-5">
                <h3 className="text-xl font-semibold text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.location}</p>
                <Link
                  className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  to={`/hotels/${item.slug}`}
                >
                  View Hotel
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isRoomsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                  Available rooms
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-slate-900">{hotel.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {checkIn} to {checkOut}, {guests} {guests === 1 ? 'guest' : 'guests'}
                </p>
              </div>
              <button
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                onClick={() => setIsRoomsModalOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {availableRoomsQuery.isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-slate-500">
                  Checking room availability...
                </div>
              ) : availableRoomsQuery.data && availableRoomsQuery.data.rooms.length > 0 ? (
                availableRoomsQuery.data.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-2xl font-semibold text-slate-900">{room.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Up to {room.capacity} guests · ${room.pricePerNight} / night
                      </p>
                    </div>
                    <button
                      className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      onClick={() => onSelectRoom(room.id)}
                      type="button"
                    >
                      Choose room
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-slate-500">
                  There are no available rooms for the selected dates. Try different dates or a
                  smaller guest count.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function HotelDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const propertyId = slug ? getPropertyIdFromSlug(slug) : null
  const { data: hotel, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => getPropertyById(propertyId!),
    enabled: propertyId !== null,
  })

  if (!propertyId) {
    return <Navigate replace to="/hotels" />
  }

  if (isLoading) {
    return (
      <div className="section-container py-20 text-center text-slate-500">Loading hotel details...</div>
    )
  }

  if (isError) {
    return (
      <div className="section-container py-20">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">
          Unable to load hotel details from the database.
        </div>
      </div>
    )
  }

  if (!hotel) {
    return <Navigate replace to="/hotels" />
  }

  return <HotelDetailsContent key={hotel.slug} hotel={hotel} />
}

export default HotelDetailsPage
