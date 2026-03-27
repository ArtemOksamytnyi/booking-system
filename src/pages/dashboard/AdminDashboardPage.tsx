import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'owners'
  | 'bookings'
  | 'refunds'
  | 'messages'
  | 'help'
  | 'settings'

const tabItems: Array<{ id: AdminTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'owners', label: 'Hotel Owners' },
  { id: 'bookings', label: 'Booking Details' },
  { id: 'refunds', label: 'Refund' },
  { id: 'messages', label: 'Message' },
  { id: 'help', label: 'Help' },
  { id: 'settings', label: 'Setting' },
]

const users = [
  { name: 'John Wick', email: 'user@lankastay.com', role: 'User' },
  { name: 'Melisa Stone', email: 'melisa@example.com', role: 'User' },
  { name: 'Bruno Vela', email: 'bruno@example.com', role: 'User' },
]

const owners = [
  { name: 'David Wagner', email: 'david_wagner@example.com', date: '24 Jun, 2023', status: 'Super Admin' },
  { name: 'Ina Hogan', email: 'owner@lankastay.com', date: '24 Aug, 2023', status: 'Owner' },
  { name: 'Devin Harmon', email: 'wintheiser_enos@yahoo.com', date: '18 Dec, 2023', status: 'Owner' },
  { name: 'Lena Page', email: 'camila_ledner@gmail.com', date: '8 Oct, 2023', status: 'Pending' },
]

function AdminDashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(
    () => users.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  const filteredOwners = useMemo(
    () => owners.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  const content = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Users</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{users.length}</p>
          </article>
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Hotel Owners</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{owners.length}</p>
          </article>
          <article className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Pending Verifications</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {owners.filter((item) => item.status === 'Pending').length}
            </p>
          </article>
        </div>
      )
    }

    if (activeTab === 'users') {
      return (
        <div className="space-y-3">
          {filteredUsers.map((person) => (
            <article key={person.email} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="font-semibold text-slate-900">{person.name}</p>
                <p className="text-sm text-slate-500">{person.email}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">{person.role}</span>
            </article>
          ))}
        </div>
      )
    }

    if (activeTab === 'owners') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-slate-100 text-base text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Create Date</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map((owner) => (
                <tr key={owner.email} className="border-b border-slate-100 text-base text-slate-700">
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900">{owner.name}</p>
                    <p className="text-sm text-slate-500">{owner.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        owner.status === 'Pending' ? 'bg-slate-200 text-slate-500' : 'bg-primary text-white'
                      }`}
                    >
                      {owner.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">{owner.date}</td>
                  <td className="px-4 py-4">Hotel Owner</td>
                  <td className="px-4 py-4">✎ 🗑</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (activeTab === 'bookings') {
      return <p className="text-slate-600">Booking monitoring panel: bookings, payment status, and check-in progress.</p>
    }

    if (activeTab === 'refunds') {
      return <p className="text-slate-600">Refund management panel: approve or reject refund requests.</p>
    }

    if (activeTab === 'messages') {
      return <p className="text-slate-600">Message center for user and owner support communication.</p>
    }

    if (activeTab === 'help') {
      return <p className="text-slate-600">Admin help center with moderation and operation guides.</p>
    }

    return <p className="text-slate-600">System settings for permissions, notifications and business rules.</p>
  }

  return (
    <div className="min-h-screen bg-[#ececec]">
      <div className="mx-auto grid min-h-screen max-w-[1700px] grid-cols-1 lg:grid-cols-[220px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-5 py-7">
          <p className="whitespace-nowrap text-3xl font-semibold leading-none text-primary">LankaStay.</p>
          <nav className="mt-8 space-y-4 text-xl text-slate-500">
            {tabItems.map((item) => (
              <button
                key={item.id}
                className={`block w-full text-left ${activeTab === item.id ? 'font-semibold text-primary' : ''}`}
                onClick={() => setActiveTab(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="space-y-6 px-6 py-7 md:px-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-3xl font-semibold text-slate-900">Hello, {user?.name || 'Admin'}</p>
              <p className="text-base text-slate-500">Have a nice day</p>
              <h1 className="mt-3 text-5xl font-semibold text-primary">Admin Dashboard</h1>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-slate-900">{user?.name || 'Admin'}</p>
              <p className="text-base text-slate-500">Admin</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <input
                className="h-11 flex-1 rounded-xl bg-slate-100 px-4 text-base outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                value={search}
              />
              {activeTab === 'owners' ? (
                <button className="h-11 rounded-xl bg-primary px-5 text-base font-semibold text-white">
                  Add Owner +
                </button>
              ) : null}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-4xl font-semibold text-slate-900">{tabItems.find((t) => t.id === activeTab)?.label}</h2>
            </div>

            {content()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboardPage
