import { Link } from 'react-router-dom'
import BookingHeader from '../../components/BookingHeader'
import { useAuth } from '../../context/AuthContext'
import { getDashboardPath } from '../../context/AuthContext'

function PaymentSuccessPage() {
  const { user } = useAuth()
  const dashboardPath = user ? getDashboardPath(user.role) : '/'

  return (
    <div className="space-y-8 pb-16">
      <BookingHeader step={3} subtitle="" title="Yay! Payment Completed" />

      <div className="section-container flex flex-col items-center gap-8 text-center">
        <div className="grid h-72 w-72 place-items-center rounded-full bg-slate-100 text-9xl text-primary">✓</div>
        <p className="text-3xl leading-relaxed text-primary">
          Please check your email & phone Message.
          <br />
          We have sent all the Information
        </p>
        <Link className="text-3xl text-slate-400 transition hover:text-primary" to={dashboardPath}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default PaymentSuccessPage
