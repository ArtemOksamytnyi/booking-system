import { Link, NavLink, Outlet } from 'react-router-dom'
import AuthModal from '../components/AuthModal'
import SuccessModal from '../components/SuccessModal'
import { getDashboardPath, humanizeRole, useAuth } from '../context/AuthContext'
import { useUiStore } from '../store/uiStore'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Hotels', to: '/hotels' },
  { label: 'Rooms', to: '/rooms' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

function SiteLayout() {
  const { user, logout } = useAuth()
  const authModalMode = useUiStore((state) => state.authModalMode)
  const successMessage = useUiStore((state) => state.successMessage)
  const isProfileMenuOpen = useUiStore((state) => state.isProfileMenuOpen)
  const openAuthModal = useUiStore((state) => state.openAuthModal)
  const closeAuthModal = useUiStore((state) => state.closeAuthModal)
  const setSuccessMessage = useUiStore((state) => state.setSuccessMessage)
  const toggleProfileMenuOpen = useUiStore((state) => state.toggleProfileMenuOpen)
  const setProfileMenuOpen = useUiStore((state) => state.setProfileMenuOpen)

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="section-container flex h-20 items-center justify-between">
          <NavLink className="text-3xl font-semibold text-primary" to="/">
            LankaStay.
          </NavLink>

          <nav className="hidden items-center gap-9 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `transition-colors hover:text-primary ${isActive ? 'text-primary' : ''}`
                }
                end={item.to === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {user ? (
            <div className="relative">
              <button
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                onClick={toggleProfileMenuOpen}
                type="button"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{humanizeRole(user.role)}</p>
                </div>
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 z-40 mt-3 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <Link
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setProfileMenuOpen(false)}
                    to={getDashboardPath(user.role)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setProfileMenuOpen(false)}
                    to="/profile"
                  >
                    Profile
                  </Link>
                  <button
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    onClick={() => {
                      logout()
                      setProfileMenuOpen(false)
                    }}
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              className="rounded-lg bg-primary px-8 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-300/70 transition hover:bg-blue-700"
              onClick={() => openAuthModal('login')}
              type="button"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-14">
        <div className="section-container flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className="text-3xl font-semibold text-primary">LankaStay.</p>
            <p className="max-w-xs text-slate-400">
              We kaboom your beauty holiday instantly and memorable.
            </p>
          </div>

          <div className="space-y-3 text-left md:text-right">
            {user ? (
              <>
                <p className="text-2xl font-medium text-slate-900">You are logged in as {user.name}</p>
                <Link
                  className="inline-flex rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-300/70 transition hover:bg-blue-700"
                  to={getDashboardPath(user.role)}
                >
                  Open Dashboard
                </Link>
              </>
            ) : (
              <>
                <p className="text-2xl font-medium text-slate-900">Become hotel Owner</p>
                <button
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-300/70 transition hover:bg-blue-700"
                  onClick={() => openAuthModal('register')}
                  type="button"
                >
                  Register Now
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {authModalMode ? (
        <AuthModal
          mode={authModalMode}
          onClose={closeAuthModal}
          onSuccess={setSuccessMessage}
          onSwitchMode={openAuthModal}
        />
      ) : null}

      {successMessage ? (
        <SuccessModal message={successMessage} onClose={() => setSuccessMessage(null)} />
      ) : null}
    </div>
  )
}

export default SiteLayout
