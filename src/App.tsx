import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import SiteLayout from './layout/SiteLayout'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import HotelDetailsPage from './pages/HotelDetailsPage'
import HotelsPage from './pages/HotelsPage'
import BookingInformationPage from './pages/booking/BookingInformationPage'
import PaymentPage from './pages/booking/PaymentPage'
import PaymentSuccessPage from './pages/booking/PaymentSuccessPage'
import AdminDashboardPage from './pages/dashboard/AdminDashboardPage'
import OwnerDashboardPage from './pages/dashboard/OwnerDashboardPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import UserDashboardPage from './pages/dashboard/UserDashboardPage'

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotels/:slug" element={<HotelDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth allow={['user']}>
              <UserDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth allow={['admin']}>
              <AdminDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/owner"
          element={
            <RequireAuth allow={['hotel_owner']}>
              <OwnerDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
      </Route>

      <Route
        path="/booking/:slug"
        element={
          <RequireAuth>
            <BookingInformationPage />
          </RequireAuth>
        }
      />
      <Route
        path="/payment"
        element={
          <RequireAuth>
            <PaymentPage />
          </RequireAuth>
        }
      />
      <Route
        path="/payment/success"
        element={
          <RequireAuth>
            <PaymentSuccessPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
