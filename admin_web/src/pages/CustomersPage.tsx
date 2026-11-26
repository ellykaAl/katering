import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Search } from 'lucide-react'
import { useCustomers, type Customer } from '../lib/customers'
import { useOrders } from '../lib/useOrders'
import { REVENUE_STATUSES, ST_DIBATALKAN } from '../lib/constants'
import {
  formatRupiah,
  formatTanggalSingkat,
  formatTanggalWaktu,
  whatsappLink,
} from '../lib/format'
import type { Order } from '../types'
import Modal from '../components/Modal'
import StatusChip from '../components/StatusChip'

type SortMode = 'belanja' | 'terbaru' | 'nama'

interface CustomerRow {
  customer: Customer
  orders: Order[]
  orderCount: number
  totalSpent: number
  lastOrderAt: Date | null
}

export default function CustomersPage() {
  const {
    customers,
    loading: loadingCustomers,
    error: customersError,
  } = useCustomers()
  const { orders, loading: loadingOrders, error: ordersError } = useOrders()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('belanja')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = useMemo<CustomerRow[]>(() => {
    const byCustomer = new Map<string, Order[]>()
    for (const o of orders) {
      const list = byCustomer.get(o.customerId) ?? []
      list.push(o)
      byCustomer.set(o.customerId, list)
    }

    return customers.map((customer) => {
      const list = byCustomer.get(customer.id) ?? []
      const counted = list.filter((o) => o.status !== ST_DIBATALKAN)
      const totalSpent = list
        .filter((o) => REVENUE_STATUSES.includes(o.status))
        .reduce((sum, o) => sum + o.totalAmount, 0)

      let lastOrderAt: Date | null = null
      for (const o of list) {
        if (o.createdAt && (!lastOrderAt || o.createdAt > lastOrderAt)) {
          lastOrderAt = o.createdAt
        }
      }

      return {
        customer,
        orders: list,
        orderCount: counted.length,
        totalSpent,
        lastOrderAt,
      }
    })
  }, [customers, orders])

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase()

    const list = rows.filter((r) => {
      if (!term) return true
      const haystack =
        `${r.customer.name} ${r.customer.email} ${r.customer.phone}`.toLowerCase()
      return haystack.includes(term)
    })

    list.sort((a, b) => {
      if (sort === 'nama') {
        return a.customer.name.localeCompare(b.customer.name)
      }
      if (sort === 'terbaru') {
        const at = a.customer.createdAt?.getTime() ?? 0
        const bt = b.customer.createdAt?.getTime() ?? 0
        return bt - at
      }
      return b.totalSpent - a.totalSpent
    })

    return list
  }, [rows, search, sort])

  const selected = rows.find((r) => r.customer.id === selectedId) ?? null
  const loading = loadingCustomers || loadingOrders
  const error = customersError ?? ordersError

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Pelanggan</h1>
      <p className="mb-5 text-sm text-stone-500">
        Akun pelanggan yang terdaftar di aplikasi, dengan ringkasan pesanannya.
      </p>

      <div className="mb-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau telepon"
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-sage-600"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600"
        >
          <option value="belanja">Urut: total belanja terbanyak</option>
          <option value="terbaru">Urut: terakhir mendaftar</option>
          <option value="nama">Urut: nama A-Z</option>
        </select>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mb-2 text-sm text-stone-500">
        Menampilkan {visibleRows.length} dari {rows.length} pelanggan
      </p>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Pelanggan</th>
              <th className="px-4 py-3">Kontak</th>
              <th className="px-4 py-3 text-right">Pesanan</th>
              <th className="px-4 py-3 text-right">Total belanja</th>
              <th className="px-4 py-3">Pesanan terakhir</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  Memuat pelanggan…
                </td>
              </tr>
            )}

            {!loading && visibleRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  {rows.length === 0
                    ? 'Belum ada pelanggan yang mendaftar.'
                    : 'Tidak ada pelanggan yang cocok.'}
                </td>
              </tr>
            )}

            {visibleRows.map((r) => (
              <tr
                key={r.customer.id}
                onClick={() => setSelectedId(r.customer.id)}
                className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-sage-50"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold">{r.customer.name || '(tanpa nama)'}</p>
                  <p className="text-xs text-stone-500">
                    Daftar {formatTanggalSingkat(r.customer.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{r.customer.email}</p>
                  <p className="text-xs text-stone-500">{r.customer.phone}</p>
                </td>
                <td className="px-4 py-3 text-right">{r.orderCount}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatRupiah(r.totalSpent)}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {r.lastOrderAt ? formatTanggalWaktu(r.lastOrderAt) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-stone-500">
        Total belanja dihitung dari pesanan yang pembayarannya sudah
        terverifikasi, berdasarkan maksimal 500 pesanan terbaru.
      </p>

      {selected && (
        <Modal
          title={selected.customer.name || 'Pelanggan'}
          onClose={() => setSelectedId(null)}
          wide
        >
          <div className="mb-4 grid gap-1 text-sm">
            <p>
              <span className="text-stone-500">Email: </span>
              {selected.customer.email}
            </p>
            <p>
              <span className="text-stone-500">Telepon: </span>
              {selected.customer.phone || '-'}
            </p>
            <p>
              <span className="text-stone-500">Terdaftar: </span>
              {formatTanggalWaktu(selected.customer.createdAt)}
            </p>
          </div>

          {selected.customer.phone && (
            <a
              href={whatsappLink(selected.customer.phone)}
              target="_blank"
              rel="noreferrer"
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100"
            >
              <MessageCircle size={16} />
              Hubungi via WhatsApp
            </a>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Jumlah pesanan</p>
              <p className="text-lg font-bold">{selected.orderCount}</p>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Total belanja</p>
              <p className="text-lg font-bold">
                {formatRupiah(selected.totalSpent)}
              </p>
            </div>
          </div>

          <h3 className="mb-2 font-semibold">Riwayat pesanan</h3>
          {selected.orders.length === 0 ? (
            <p className="text-sm text-stone-500">Belum pernah memesan.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {selected.orders.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/pesanan/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-sage-50"
                  >
                    <div>
                      <p className="text-sm font-semibold">{o.orderNumber}</p>
                      <p className="text-xs text-stone-500">
                        Kirim {formatTanggalSingkat(o.deliveryDate)},{' '}
                        {o.deliveryTimeSlot}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {formatRupiah(o.totalAmount)}
                      </span>
                      <StatusChip status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  )
}