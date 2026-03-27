function AboutPage() {
  return (
    <div className="section-container space-y-12 py-12 pb-16">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">About</p>
          <h1 className="text-4xl font-semibold text-slate-900">Hospitality Designed For Modern Travelers</h1>
          <p className="text-slate-500">
            LankaStay started with one goal: make booking memorable places simple and transparent.
            We partner with local owners and verified hotels to deliver better stays.
          </p>
          <p className="text-slate-500">
            Every listing is reviewed by our team for location quality, room condition, and service
            reliability.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80"
          alt="Hotel lobby"
          className="h-80 w-full rounded-3xl object-cover"
        />
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: '2,500+', subtitle: 'Happy Travelers' },
          { title: '200+', subtitle: 'Curated Stays' },
          { title: '100+', subtitle: 'Cities Covered' },
          { title: '4.9/5', subtitle: 'Average Rating' },
        ].map((item) => (
          <article key={item.title} className="rounded-2xl bg-white p-6 text-center shadow-sm shadow-slate-200">
            <p className="text-3xl font-semibold text-primary">{item.title}</p>
            <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <h2 className="text-3xl font-semibold text-slate-900">Why Guests Choose Us</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            'Verified properties and transparent photos.',
            'Fast support team with real local knowledge.',
            'Flexible booking options with fair pricing.',
          ].map((point) => (
            <div key={point} className="rounded-xl bg-slate-50 p-5 text-slate-600">
              {point}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AboutPage
