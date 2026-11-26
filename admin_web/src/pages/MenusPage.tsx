import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCategories, useMenus, type Menu } from '../lib/catalog'
import { deleteMenu, setMenuAvailability } from '../lib/catalogActions'
import { formatRupiah } from '../lib/format'
import MenuFormModal from '../components/MenuFormModal'
import MenuThumb from '../components/MenuThumb'
import Modal from '../components/Modal'

type AvailFilter = 'semua' | 'tersedia' | 'nonaktif'

export default function MenusPage() {
  const { items: menus, loading, error } = useMenus()
  const { items: categories } = useCategories()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('semua')
  const [availFilter, setAvailFilter] = useState<AvailFilter>('semua')

  const [formTarget, setFormTarget] = useState<Menu | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Menu | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return menus.filter((m) => {
      if (categoryFilter !== 'semua' && m.categoryId !== categoryFilter) {
        return false
      }
      if (availFilter === 'tersedia' && !m.isAvailable) return false
      if (availFilter === 'nonaktif' && m.isAvailable) return false
      if (term && !m.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [menus, search, categoryFilter, availFilter])

  async function toggleAvailability(menu: Menu) {
    setBusyId(menu.id)
    setActionError(null)
    try {
      await setMenuAvailability(menu.id, !menu.isAvailable)
    } catch (e) {
      setActionError(
        e instanceof Error ? `Gagal mengubah status: ${e.message}` : 'Gagal mengubah status.',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    setActionError(null)
    try {
      await deleteMenu(deleting.id)
      setDeleting(null)
    } catch (e) {
      setActionError(
        e instanceof Error ? `Gagal menghapus: ${e.message}` : 'Gagal menghapus menu.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const noCategories = categories.length === 0

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Menu</h1>
          <p className="text-sm text-stone-500">
            Kelola daftar makanan yang tampil di aplikasi pelanggan.
          </p>
        </div>
        <button
          type="button"
          disabled={noCategories}
          onClick={() => setFormTarget('new')}
          className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-50"
        >
          <Plus size={16} />
          Tambah Menu
        </button>
      </div>

      {noCategories && !loading && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Belum ada kategori. Buat kategori dulu di halaman{' '}
          <Link to="/kategori" className="font-semibold underline">
            Kategori
          </Link>
          , lalu kembali ke sini untuk menambah menu.
        </p>
      )}

      {/* Filter */}
      <div className="mb-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu"
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-sage-600"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600"
        >
          <option value="semua">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value as AvailFilter)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600"
        >
          <option value="semua">Semua status</option>
          <option value="tersedia">Hanya tersedia</option>
          <option value="nonaktif">Hanya nonaktif</option>
        </select>
      </div>

      {(error || actionError) && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? actionError}
        </p>
      )}

      <p className="mb-2 text-sm text-stone-500">
        Menampilkan {filtered.length} dari {menus.length} menu
      </p>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Menu</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-right">Harga</th>
              <th className="px-4 py-3 text-right">Min. pesan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  Memuat menu…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  {menus.length === 0
                    ? 'Belum ada menu. Klik "Tambah Menu" untuk memulai.'
                    : 'Tidak ada menu yang cocok dengan filter.'}
                </td>
              </tr>
            )}

            {filtered.map((m) => {
              const catName = categoryName.get(m.categoryId)
              return (
                <tr
                  key={m.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-sage-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MenuThumb key={m.imageUrl} url={m.imageUrl} />
                      <div className="min-w-0">
                        <p className="font-semibold">{m.name}</p>
                        {m.description && (
                          <p className="max-w-xs truncate text-xs text-stone-500">
                            {m.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {catName ?? (
                      <span className="text-amber-700">Tanpa kategori</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatRupiah(m.price)}
                  </td>
                  <td className="px-4 py-3 text-right">{m.minOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => toggleAvailability(m)}
                      title="Klik untuk mengubah status"
                      className={`rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-60 ${
                        m.isAvailable
                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          : 'border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {m.isAvailable ? 'Tersedia' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setFormTarget(m)}
                        aria-label={`Ubah ${m.name}`}
                        title="Ubah"
                        className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(m)}
                        aria-label={`Hapus ${m.name}`}
                        title="Hapus"
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {formTarget !== null && (
        <MenuFormModal
          menu={formTarget === 'new' ? null : formTarget}
          categories={categories}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleting && (
        <Modal
          title="Hapus menu"
          onClose={() => {
            if (busyId === null) setDeleting(null)
          }}
        >
          <p className="mb-2 text-sm text-stone-700">
            Menu <span className="font-semibold">{deleting.name}</span> akan
            dihapus permanen dari katalog.
          </p>
          <p className="mb-4 text-sm text-stone-600">
            Pesanan lama tidak terpengaruh karena nama dan harga tersimpan di
            tiap pesanan. Jika hanya ingin menyembunyikan menu untuk sementara,
            gunakan status <span className="font-medium">Nonaktif</span>.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={confirmDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busyId !== null ? 'Menghapus…' : 'Ya, Hapus'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}