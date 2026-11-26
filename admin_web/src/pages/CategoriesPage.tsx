import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useCategories, useMenus, type Category } from '../lib/catalog'
import {
  createCategory,
  deleteCategory,
  renameCategory,
} from '../lib/catalogActions'
import Modal from '../components/Modal'

interface CategoryFormModalProps {
  /** null = kategori baru. */
  category: Category | null
  categories: Category[]
  onClose: () => void
}

function CategoryFormModal({
  category,
  categories,
  onClose,
}: CategoryFormModalProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (!saving) onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const clean = name.trim()
    if (clean.length < 2 || clean.length > 40) {
      setError('Nama kategori 2 sampai 40 karakter.')
      return
    }

    const duplicate = categories.some(
      (c) =>
        c.id !== category?.id && c.name.toLowerCase() === clean.toLowerCase(),
    )
    if (duplicate) {
      setError('Sudah ada kategori dengan nama itu.')
      return
    }

    setSaving(true)
    try {
      if (category) {
        await renameCategory(category.id, clean)
      } else {
        await createCategory(clean)
      }
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? `Gagal menyimpan: ${err.message}` : 'Gagal menyimpan kategori.',
      )
      setSaving(false)
    }
  }

  return (
    <Modal
      title={category ? 'Ubah kategori' : 'Tambah kategori'}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit}>
        <label className="mb-1 block text-sm font-medium" htmlFor="cat-name">
          Nama kategori
        </label>
        <input
          id="cat-name"
          type="text"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Nasi Box"
          className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
        />

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function CategoriesPage() {
  const { items: categories, loading, error } = useCategories()
  const { items: menus } = useMenus()

  const [formTarget, setFormTarget] = useState<Category | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const menuCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of menus) {
      map.set(m.categoryId, (map.get(m.categoryId) ?? 0) + 1)
    }
    return map
  }, [menus])

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setActionError(null)
    try {
      await deleteCategory(deleting.id)
      setDeleting(null)
    } catch (e) {
      setDeleting(null)
      setActionError(
        e instanceof Error ? e.message : 'Gagal menghapus kategori.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kategori</h1>
          <p className="text-sm text-stone-500">
            Pengelompokan menu yang tampil sebagai filter di aplikasi pelanggan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormTarget('new')}
          className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage-700"
        >
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      {(error || actionError) && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? actionError}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3 text-right">Jumlah menu</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-500">
                  Memuat kategori…
                </td>
              </tr>
            )}

            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-500">
                  Belum ada kategori. Klik "Tambah Kategori" untuk memulai.
                </td>
              </tr>
            )}

            {categories.map((c) => {
              const count = menuCount.get(c.id) ?? 0
              return (
                <tr
                  key={c.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-sage-50"
                >
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 text-right">{count}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setFormTarget(c)}
                        aria-label={`Ubah ${c.name}`}
                        title="Ubah nama"
                        className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={count > 0}
                        onClick={() => setDeleting(c)}
                        aria-label={`Hapus ${c.name}`}
                        title={
                          count > 0
                            ? 'Tidak bisa dihapus karena masih dipakai menu'
                            : 'Hapus'
                        }
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
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

      <p className="mt-3 text-xs text-stone-500">
        Kategori yang masih dipakai oleh menu tidak bisa dihapus. Pindahkan
        menunya ke kategori lain lewat halaman Menu terlebih dahulu.
      </p>

      {formTarget !== null && (
        <CategoryFormModal
          category={formTarget === 'new' ? null : formTarget}
          categories={categories}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleting && (
        <Modal
          title="Hapus kategori"
          onClose={() => {
            if (!busy) setDeleting(null)
          }}
        >
          <p className="mb-4 text-sm text-stone-700">
            Kategori <span className="font-semibold">{deleting.name}</span> akan
            dihapus permanen.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={confirmDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? 'Menghapus…' : 'Ya, Hapus'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}