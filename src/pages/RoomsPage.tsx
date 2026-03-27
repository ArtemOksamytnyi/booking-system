import { rooms } from '../data/hotels'

function RoomsPage() {
  return (
    <div className="section-container space-y-10 py-12 pb-16">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Rooms</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900">Choose Your Room Type</h1>
          <p className="mt-3 max-w-2xl text-slate-500">
            From compact city lofts to private pool villas. Every room is picked for comfort and
            style.
          </p>
        </div>
        <button className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Check Availability
        </button>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <article key={room.name} className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200">
            <img src={room.image} alt={room.name} className="h-52 w-full object-cover" />
            <div className="space-y-3 p-5">
              <h2 className="text-2xl font-medium text-slate-900">{room.name}</h2>
              <p className="text-sm text-slate-500">{room.type}</p>
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
    </div>
  )
}

export default RoomsPage
