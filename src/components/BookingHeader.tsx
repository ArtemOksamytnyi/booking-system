import { Link } from 'react-router-dom'

type BookingHeaderProps = {
  compact?: boolean
  step: 1 | 2 | 3
  title: string
  subtitle: string
}

function BookingHeader({ compact = false, step, title, subtitle }: BookingHeaderProps) {
  return (
    <div className={compact ? 'space-y-3 text-center' : 'space-y-6 text-center'}>
      <header className={`border-b border-slate-200 bg-white ${compact ? 'py-2' : 'py-4'}`}>
        <Link className={`font-semibold text-primary ${compact ? 'text-3xl' : 'text-5xl'}`} to="/">
          LankaStay.
        </Link>
      </header>

      <div className={`flex items-center justify-center ${compact ? 'gap-2' : 'gap-3'}`}>
        {[1, 2, 3].map((index) => {
          const done = index < step || (index === step && step === 3)
          const current = index === step
          return (
            <div className="flex items-center" key={index}>
              <div
                className={`grid place-items-center rounded-full font-semibold ${
                  compact ? 'h-8 w-8 text-sm' : 'h-12 w-12 text-xl'
                } ${
                  done || current ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done || current ? '✓' : index}
              </div>
              {index < 3 ? <div className={`h-px bg-slate-200 ${compact ? 'w-8' : 'w-12'}`} /> : null}
            </div>
          )
        })}
      </div>

      <div>
        <h1 className={`font-semibold text-slate-900 ${compact ? 'text-2xl' : 'text-3xl'}`}>{title}</h1>
        {subtitle ? <p className={`text-slate-400 text-xl`}>{subtitle}</p> : null}
      </div>
    </div>
  )
}

export default BookingHeader
