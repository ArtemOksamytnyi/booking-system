import { Link } from 'react-router-dom'

type BookingHeaderProps = {
  step: 1 | 2 | 3
  title: string
  subtitle: string
}

function BookingHeader({ step, title, subtitle }: BookingHeaderProps) {
  return (
    <div className="space-y-6 text-center">
      <header className="border-b border-slate-200 bg-white py-4">
        <Link className="text-5xl font-semibold text-primary" to="/">
          LankaStay.
        </Link>
      </header>

      <div className="flex items-center justify-center gap-3">
        {[1, 2, 3].map((index) => {
          const done = index < step || (index === step && step === 3)
          const current = index === step
          return (
            <div className="flex items-center" key={index}>
              <div
                className={`grid h-12 w-12 place-items-center rounded-full text-xl font-semibold ${
                  done || current ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done || current ? '✓' : index}
              </div>
              {index < 3 ? <div className="h-px w-12 bg-slate-200" /> : null}
            </div>
          )
        })}
      </div>

      <div>
        <h1 className="text-5xl font-semibold text-slate-900 md:text-6xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-xl text-slate-400">{subtitle}</p> : null}
      </div>
    </div>
  )
}

export default BookingHeader
