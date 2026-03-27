function ContactPage() {
  return (
    <div className="section-container grid gap-8 py-12 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Contact</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Let Us Plan Your Next Stay</h1>
        <p className="mt-3 text-slate-500">
          Send us your preferred dates and city. We will shortlist matching hotels and rooms.
        </p>

        <form className="mt-8 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Full Name</span>
            <input
              className="h-12 rounded-xl border border-slate-200 px-4 outline-none transition focus:border-primary"
              placeholder="John Doe"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="h-12 rounded-xl border border-slate-200 px-4 outline-none transition focus:border-primary"
              placeholder="john@example.com"
              type="email"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Message</span>
            <textarea
              className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary"
              placeholder="I need a room near Colombo for 3 nights..."
            />
          </label>
          <button className="h-12 rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-blue-700">
            Send Message
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <article className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Office</h2>
          <div className="mt-4 space-y-2 text-slate-600">
            <p>45 Lotus Road, Colombo 03</p>
            <p>+94 11 234 5678</p>
            <p>support@lankastay.com</p>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl bg-white shadow-sm shadow-slate-200">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
            alt="City map"
            className="h-72 w-full object-cover"
          />
        </article>
      </section>
    </div>
  )
}

export default ContactPage
