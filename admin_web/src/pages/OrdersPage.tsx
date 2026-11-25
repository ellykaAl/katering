import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { Search } from 'lucide-react'
import { db } from '../firebase'
import type { Order } from '../types'
import { toOrder } from '../lib/mappers'
import { ALL_STATUSES, ST_MENUNGGU_VERIFIKASI } from '../lib/constants'
import {
  formatRupiah,
  formatTanggalSingkat,
  formatTanggalWaktu,
} from '../lib/format'
import StatusChip from '../components/StatusChip'

type SortMode = 'terbaru' | 'kirim'

export default function OrdersPage() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState('Semua')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('terbaru')

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(500),
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => toOrder(d.id, d.data())))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(`Gagal memuat pesanan: ${err.message}`)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const counts = useMemo(() => {
    const result: Record<string, number> = {}
    for (const o of orders) {
      result[o.status] = (result[o.status] ?? 0) + 1
    }
    return result
  }, [orders])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    const list = orders.filter((o) => {
      if (status !== 'Semua' && o.status !== status) return false
      if (dateFrom && o.deliveryDateKey < dateFrom) return false
      if (dateTo && o.deliveryDateKey > dateTo) return false
      if (term) {
        const haystack =
          `${o.orderNumber} ${o.recipientName} ${o.recipientPhone}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })

    if (sort === 'kirim') {
      list.sort(
        (a, b) =>
          a.deliveryDateKey.localeCompare(b.deliveryDateKey) ||
          a.deliverySlotId.localeCompare(b.deliverySlotId),
      )
    }

    return list
  }, [orders, status, dateFrom, dateTo, search, sort])

  const waiting = counts[ST_MENUNGGU_VERIFIKASI] ?? 0
  const hasFilter =
    status !== 'Semua' || dateFrom !== '' || dateTo !== '' || search !== ''

  function resetFilters() {
    setStatus('Semua')
    setDateFrom('')
    setDateTo('')
    setSearch('')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Pesanan</h1>
      <p className="mb-5 text-sm text-stone-500">
        Daftar semua pesanan pre-order, diperbarui otomatis.
      </p>

      {waiting > 0 && (
        <button
          type="button"
          onClick={() => setStatus(ST_MENUNGGU_VERIFIKASI)}
          className="mb-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm text-blue-800 hover:bg-blue-100"
        >
          <span className="font-semibold">{waiting} pembayaran</span> menunggu
          verifikasi. Klik untuk menampilkannya.
        </button>
      )}

      {/* Tab status */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {['Semua', ...ALL_STATUSES].map((s) => {
          const active = status === s
          const count = s === 'Semua' ? orders.length : (counts[s] ?? 0)
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                active
                  ? 'border-sage-600 bg-sage-600 text-white'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              {s} ({count})
            </button>
          )
        })}
      </div>

      {/* Filter */}
      <div className="mb-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor pesanan, nama, telepon"
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-sage-600"
          />
        </div>

        <label className="text-xs text-stone-500">
          Kirim dari tanggal
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none focus:border-sage-600"
          />
        </label>

        <label className="text-xs text-stone-500">
          Sampai tanggal
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none focus:border-sage-600"
          />
        </label>

        <label className="text-xs text-stone-500">
          Urutkan
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none focus:border-sage-600"
          >
            <option value="terbaru">Terbaru dibuat</option>
            <option value="kirim">Tanggal kirim terdekat</option>
          </select>
        </label>
      </div>

      <div className="mb-2 flex items-center justify-between text-sm text-stone-500">
        <span>
          Menampilkan {filtered.length} dari {orders.length} pesanan
        </span>
        {hasFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="font-medium text-sage-700 hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Pesanan</th>
              <th className="px-4 py-3">Penerima</th>
              <th className="px-4 py-3">Pengiriman</th>
              <th className="px-4 py-3 text-right">Porsi</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  Memuat pesanan…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  Tidak ada pesanan yang cocok.
                </td>
              </tr>
            )}

            {filtered.map((o) => (
              <tr
                key={o.id}
                onClick={() => navigate(`/pesanan/${o.id}`)}
                className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-sage-50"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-stone-500">
                    {formatTanggalWaktu(o.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{o.recipientName}</p>
                  <p className="text-xs text-stone-500">{o.recipientPhone}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{formatTanggalSingkat(o.deliveryDate)}</p>
                  <p className="text-xs text-stone-500">{o.deliveryTimeSlot}</p>
                </td>
                <td className="px-4 py-3 text-right">{o.totalPortions}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatRupiah(o.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}