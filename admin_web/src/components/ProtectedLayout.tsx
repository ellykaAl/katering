import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { ClipboardList, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/useAuth'

const NAV_ITEMS = [{ to: '/pesanan', label: 'Pesanan', icon: ClipboardList }]

export default function ProtectedLayout() {
  const { user, adminName, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-500">
        Memuat…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen">
      {/* Bilah atas untuk layar kecil */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="rounded p-1 hover:bg-stone-100"
        >
          <Menu size={22} />
        </button>
        <span className="font-semibold text-sage-700">Admin Katering</span>
      </header>

      {/* Latar gelap saat sidebar terbuka di layar kecil */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-stone-200 bg-white transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-lg font-bold text-sage-700">Admin Katering</p>
            <p className="text-xs text-stone-500">Kelola pesanan pre-order</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="rounded p-1 hover:bg-stone-100 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sage-100 text-sage-700'
                    : 'text-stone-600 hover:bg-stone-100'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-200 p-4">
          <p className="truncate text-sm font-medium">{adminName}</p>
          <p className="mb-3 text-xs text-stone-500">Admin</p>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      <main className="p-4 md:ml-64 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}