import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { db } from '../firebase'
import type { Order } from '../types'
import {
  ALL_STATUSES,
  DEFAULT_MAX_PORTIONS,
  DELIVERY_SLOTS,
  ST_DIBATALKAN,
} from '../lib/constants'
import {
  addDaysToKey,
  dateKey,
  formatRupiah,
  formatTanggal,
  parseKey,
} from '../lib/format'
import { setSlotQuota } from '../lib/slotActions'
import StatusChip from './StatusChip'
import Modal from './Modal'

interface SlotUsage {
  used: number
  max: number
}

interface DailyViewProps {
  date: string // "YYYY-MM-DD"
  orders: Order[]
  loading: boolean
  onChangeDate: (key: string) => void
}

function ScheduleOrderCard({ order }: { order: Order }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/pesanan/${order.id}`}
          className="font-semibold text-sage-700 hover:underline"
        >
          {order.orderNumber}
        </Link>
        <StatusChip status={order.status} />
      </div>

      <p className="text-sm font-medium">
        {order.recipientName}
        <span className="font-normal text-stone-500">
          {' '}
          · {order.recipientPhone}
        </span>
      </p>
      <p className="mb-2 text-sm text-stone-600">{order.address}</p>

      <ul className="mb-2 space-y-0.5 text-sm">
        {order.items.map((item, i) => (
          <li key={`${item.menuId}-${i}`} className="flex justify-between gap-3">
            <span>{item.name}</span>
            <span className="shrink-0 font-medium">× {item.quantity}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mb-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
          Catatan: {order.notes}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-sm">
        <span className="text-stone-500">{order.totalPortions} porsi</span>
        <span className="font-semibold">{formatRupiah(order.totalAmount)}</span>
      </div>
    </div>
  )
}

export default function DailyView({
  date,
  orders,
  loading,
  onChangeDate,
}: DailyViewProps) {
  const [usage, setUsage] = useState<Record<string, SlotUsage>>({})
  const [statusFilter, setStatusFilter] = useState('aktif')

  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [quotaInput, setQuotaInput] = useState('')
  const [quotaError, setQuotaError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Kuota dan pemakaian tiap slot pada tanggal terpilih (real-time).
  useEffect(() => {
    const unsubscribers = DELIVERY_SLOTS.map((slot) =>
      onSnapshot(
        doc(db, 'deliverySlots', `${date}_${slot.id}`),
        (snap) => {
          const data = snap.data()
          setUsage((prev) => ({
            ...prev,
            [`${date}_${slot.id}`]: {
              used: Number(data?.usedPortions ?? 0),
              max: Number(data?.maxPortions ?? DEFAULT_MAX_PORTIONS),
            },
          }))
        },
        () => {
          // Diabaikan: kartu kuota akan menampilkan nilai bawaan.
        },
      ),
    )

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [date])

  const dayOrders = orders.filter((o) => o.deliveryDateKey === date)
  const activeOrders = dayOrders.filter((o) => o.status !== ST_DIBATALKAN)
  const totalPortions = activeOrders.reduce((sum, o) => sum + o.totalPortions, 0)

  const visible = dayOrders.filter((o) => {
    if (statusFilter === 'aktif') return o.status !== ST_DIBATALKAN
    if (statusFilter === 'semua') return true
    return o.status === statusFilter
  })

  const unknownSlotOrders = visible.filter(
    (o) => !DELIVERY_SLOTS.some((s) => s.id === o.deliverySlotId),
  )

  function usageOf(slotId: string): SlotUsage {
    return (
      usage[`${date}_${slotId}`] ?? { used: 0, max: DEFAULT_MAX_PORTIONS }
    )
  }

  function openQuota(slotId: string) {
    setEditingSlot(slotId)
    setQuotaInput(String(usageOf(slotId).max))
    setQuotaError(null)
  }

  function closeQuota() {
    if (saving) return
    setEditingSlot(null)
    setQuotaError(null)
  }

  async function saveQuota() {
    if (!editingSlot) return

    const value = Number(quotaInput)
    if (!Number.isInteger(value) || value < 0 || value > 10000) {
      setQuotaError('Isi dengan bilangan bulat 0 sampai 10000.')
      return
    }

    setSaving(true)
    setQuotaError(null)
    try {
      await setSlotQuota(date, editingSlot, value)
      setEditingSlot(null)
    } catch (e) {
      setQuotaError(
        e instanceof Error ? e.message : 'Gagal menyimpan kuota.',
      )
    } finally {
      setSaving(false)
    }
  }

  const editing = DELIVERY_SLOTS.find((s) => s.id === editingSlot)

  return (
    <div>
      {/* Pemilih tanggal */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChangeDate(addDaysToKey(date, -1))}
          aria-label="Hari sebelumnya"
          className="rounded-lg border border-stone-300 bg-white p-2 hover:bg-stone-100"
        >
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) onChangeDate(e.target.value)
          }}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600"
        />
        <button
          type="button"
          onClick={() => onChangeDate(addDaysToKey(date, 1))}
          aria-label="Hari berikutnya"
          className="rounded-lg border border-stone-300 bg-white p-2 hover:bg-stone-100"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => onChangeDate(dateKey(new Date()))}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100"
        >
          Hari ini
        </button>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-auto rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600"
        >
          <option value="aktif">Semua kecuali dibatalkan</option>
          <option value="semua">Semua termasuk dibatalkan</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              Hanya {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">{formatTanggal(parseKey(date))}</h2>
        <p className="text-sm text-stone-500">
          {activeOrders.length} pesanan · {totalPortions} porsi
        </p>
      </div>

      {/* Kuota per slot */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {DELIVERY_SLOTS.map((slot) => {
          const u = usageOf(slot.id)
          const pct =
            u.max > 0 ? Math.min(100, Math.round((u.used / u.max) * 100)) : 100
          const full = u.used >= u.max

          return (
            <div
              key={slot.id}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold">{slot.label}</p>
                <button
                  type="button"
                  onClick={() => openQuota(slot.id)}
                  className="text-xs font-medium text-sage-700 hover:underline"
                >
                  Ubah kuota
                </button>
              </div>
              <p className="text-sm text-stone-600">
                Terpakai {u.used} / {u.max} porsi
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full ${
                    full ? 'bg-red-500' : 'bg-sage-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {full && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  Slot penuh
                </p>
              )}
            </div>
          )
        })}
      </div>

      {loading && <p className="mb-4 text-sm text-stone-500">Memuat pesanan…</p>}

      {/* Pesanan per slot */}
      {DELIVERY_SLOTS.map((slot) => {
        const list = visible.filter((o) => o.deliverySlotId === slot.id)
        const portions = list.reduce((sum, o) => sum + o.totalPortions, 0)

        return (
          <section key={slot.id} className="mb-6">
            <h3 className="mb-2 flex flex-wrap items-baseline gap-2 font-semibold">
              {slot.label}
              <span className="text-sm font-normal text-stone-500">
                {list.length} pesanan · {portions} porsi
              </span>
            </h3>

            {list.length === 0 ? (
              <p className="rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500">
                Tidak ada pesanan pada slot ini.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((o) => (
                  <ScheduleOrderCard key={o.id} order={o} />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {unknownSlotOrders.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-2 font-semibold">Slot lain</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {unknownSlotOrders.map((o) => (
              <ScheduleOrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      {/* Dialog ubah kuota */}
      {editing && (
        <Modal title={`Ubah kuota ${editing.label}`} onClose={closeQuota}>
          <p className="mb-3 text-sm text-stone-600">
            Tanggal {formatTanggal(parseKey(date))}. Terpakai saat ini{' '}
            {usageOf(editing.id).used} porsi, dan kuota tidak boleh lebih
            kecil dari itu.
          </p>
          <label className="mb-1 block text-sm font-medium" htmlFor="quota">
            Kuota maksimal (porsi)
          </label>
          <input
            id="quota"
            type="number"
            min={0}
            value={quotaInput}
            onChange={(e) => setQuotaInput(e.target.value)}
            className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-sage-600"
          />
          {quotaError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {quotaError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeQuota}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveQuota}
              className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}