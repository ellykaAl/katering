import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import MenuThumb from './MenuThumb'
import type { Category, Menu } from '../lib/catalog'
import { createMenu, updateMenu } from '../lib/catalogActions'

interface MenuFormModalProps {
  /** null = menu baru. */
  menu: Menu | null
  categories: Category[]
  onClose: () => void
}

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100'

export default function MenuFormModal({
  menu,
  categories,
  onClose,
}: MenuFormModalProps) {
  const [name, setName] = useState(menu?.name ?? '')
  const [categoryId, setCategoryId] = useState(menu?.categoryId ?? '')
  const [description, setDescription] = useState(menu?.description ?? '')
  const [price, setPrice] = useState(menu ? String(menu.price) : '')
  const [minOrder, setMinOrder] = useState(menu ? String(menu.minOrder) : '1')
  const [imageUrl, setImageUrl] = useState(menu?.imageUrl ?? '')
  const [isAvailable, setIsAvailable] = useState(menu?.isAvailable ?? true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (!saving) onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanName = name.trim()
    const cleanImage = imageUrl.trim()
    const priceValue = Number(price)
    const minValue = Number(minOrder)

    if (cleanName.length < 2) {
      setError('Nama menu minimal 2 karakter.')
      return
    }
    if (!categories.some((c) => c.id === categoryId)) {
      setError('Pilih kategori menu.')
      return
    }
    if (!Number.isInteger(priceValue) || priceValue <= 0 || priceValue > 100_000_000) {
      setError('Harga harus bilangan bulat lebih dari 0.')
      return
    }
    if (!Number.isInteger(minValue) || minValue < 1 || minValue > 1000) {
      setError('Minimal pemesanan harus bilangan bulat 1 sampai 1000.')
      return
    }
    if (cleanImage && !/^https?:\/\/\S+$/i.test(cleanImage)) {
      setError('Tautan foto harus diawali http:// atau https://.')
      return
    }

    const input = {
      categoryId,
      name: cleanName,
      description: description.trim(),
      price: priceValue,
      imageUrl: cleanImage,
      isAvailable,
      minOrder: minValue,
    }

    setSaving(true)
    try {
      if (menu) {
        await updateMenu(menu.id, input)
      } else {
        await createMenu(input)
      }
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? `Gagal menyimpan: ${err.message}` : 'Gagal menyimpan menu.',
      )
      setSaving(false)
    }
  }

  return (
    <Modal title={menu ? 'Ubah menu' : 'Tambah menu'} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <label className="mb-1 block text-sm font-medium" htmlFor="menu-name">
          Nama menu
        </label>
        <input
          id="menu-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} mb-3`}
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="menu-cat">
          Kategori
        </label>
        <select
          id="menu-cat"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`${inputClass} mb-3 bg-white`}
        >
          <option value="">Pilih kategori…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-medium" htmlFor="menu-desc">
          Deskripsi
        </label>
        <textarea
          id="menu-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contoh: Nasi putih, ayam bakar, lalapan, sambal"
          className={`${inputClass} mb-3`}
        />

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="menu-price">
              Harga (Rp)
            </label>
            <input
              id="menu-price"
              type="number"
              min={0}
              step={500}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="menu-min">
              Minimal pesan (porsi)
            </label>
            <input
              id="menu-min"
              type="number"
              min={1}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium" htmlFor="menu-img">
          Tautan foto (opsional)
        </label>
        <input
          id="menu-img"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…/foto.jpg"
          className={`${inputClass} mb-2`}
        />
        {imageUrl.trim() && (
          <div className="mb-3">
            <MenuThumb key={imageUrl.trim()} url={imageUrl.trim()} className="h-24 w-24" />
          </div>
        )}

        <label className="mb-4 mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="h-4 w-4 accent-[#6f8c6b]"
          />
          Menu tersedia untuk dipesan
        </label>

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