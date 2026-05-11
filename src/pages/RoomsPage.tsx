import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProperties } from '../api/properties'

function RoomsPage() {
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['properties', 'rooms-page'],
    queryFn: () => getProperties(),
  })

  const roomCards = useMemo(
    () =>
      hotels.flatMap((hotel) =>
        hotel.rooms.map((room) => ({
          id: `${hotel.id}-${room.id}`,
          roomName: room.name,
          hotelName: hotel.name,
          guests: `${room.capacity} Guest${room.capacity > 1 ? 's' : ''}`,
          image: hotel.image,
          price: `$${room.pricePerNight} / night`,
        })),
      ),
    [hotels],
  )

  return (
    <div className="section-container space-y-10 py-12 pb-16">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Rooms</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900">Choose Your Room Type</h1>
          <p className="mt-3 max-w-2xl text-slate-500">
            Browse room types that are now being pulled from your database, not from static mocks.
          </p>
        </div>
        <button className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Check Availability
        </button>
      </section>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500">Loading room types...</div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roomCards.map((room) => (
            <article key={room.id} className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200">
              <img src={room.image} alt={room.roomName} className="h-52 w-full object-cover" />
              <div className="space-y-3 p-5">
                <h2 className="text-2xl font-medium text-slate-900">{room.roomName}</h2>
                <p className="text-sm text-slate-500">{room.hotelName}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-primary">
                    {room.guests}
                  </span>
                  <span className="font-semibold text-slate-800">{room.price}</span>
                </div>
                <button className="w-full rounded-lg border border-blue-200 py-2 text-sm font-semibold text-primary transition hover:bg-blue-50">
                  Reserve Room
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default RoomsPage
