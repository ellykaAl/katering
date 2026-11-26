import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, ShoppingBag, Wallet } from 'lucide-react'
import { useOrders } from '../lib/useOrders'
import {
  ACTIVE_STATUSES,
  ALL_STATUSES,
  REVENUE_STATUSES,
  ST_DIBATALKAN,
  ST_MENUNGGU_VERIFIKASI,
  ST_SELESAI,
  UPCOMING_STATUSES,
} from '../lib/constants'
import {
  dateKey,
  formatRupiah,
  formatTanggalSingkat,
} from '../lib/format'
import StatusChip from '../components/StatusChip'

type Period = 'semua' | 'bulan' | '7hari'

const PERIOD_LABEL: Record<Period, string> = {
  semua: 'Semua waktu',
  bulan: 'Bulan ini',
  '7hari': '7 hari terakhir',
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-stone-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { orders, loading, error } = useOrders()
  const [period, setPeriod] = useState<Period>('semua')
  const [now] = useState(() => new Date())
  const todayKey = dateKey(now)

  const inPeriod = useMemo(() => {
    if (period === 'semua') return orders

    const start =
      period === 'bulan'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return orders.filter((o) => o.createdAt !== null && o.createdAt >= start)
  }, [orders, period, now])

  const stats = useMemo(() => {
    let revenue = 0
    let active = 0
    let done = 0
    const byStatus: Record<string, number> = {}
    const menuPortions = new Map<string, number>()

    for (const o of inPeriod) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1

      if (REVENUE_STATUSES.includes(o.status)) revenue += o.totalAmount
      if (ACTIVE_STATUSES.includes(o.status)) active += 1
      if (o.status === ST_SELESAI) done += 1

      if (o.status !== ST_DIBATALKAN) {
        for (const item of o.items) {
          menuPortions.set(
            item.name,
            (menuPortions.get(item.name) ?? 0) + item.quantity,
          )
        }
      }
    }

    const topMenus = [...menuPortions.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { revenue, active, done, byStatus, topMenus }
  }, [inPeriod])

  // Pembayaran yang menunggu dicek dihitung dari semua pesanan, bukan per periode.
  const waiting = orders.filter((o) => o.status === ST_MENUNGGU_VERIFIKASI).length

  const upcoming = useMemo(() => {
    return orders
      .filter(
        (o) =>
          o.deliveryDateKey >= todayKey && UPCOMING_STATUSES.includes(o.status),
      )
      .sort(
        (a, b) =>
          a.deliveryDateKey.localeCompare(b.deliveryDateKey) ||
          a.deliverySlotId.localeCompare(b.deliverySlotId),
      )
      .slice(0, 6)
  }, [orders, todayKey])

  const maxStatusCount = Math.max(
    1,
    ...ALL_STATUSES.map((s) => stats.byStatus[s] ?? 0),
  )

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-stone-500">
            Ringkasan pesanan, diperbarui otomatis.
          </p>
        </div>

        <label className="text-xs text-stone-500">
          Periode (berdasarkan tanggal pesanan dibuat)
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="mt-1 block rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-sage-600"
          >
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-stone-500">Memuat data…</p>
      ) : (
        <>
          {waiting > 0 && (
            <Link
              to="/pesanan"
              className="mb-5 block rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 hover:bg-blue-100"
            >
              <span className="font-semibold">{waiting} pembayaran</span>{' '}
              menunggu verifikasi. Klik untuk membuka daftar pesanan.
            </Link>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<ShoppingBag size={18} />}
              label="Total pesanan"
              value={String(inPeriod.length)}
              hint="Semua status, termasuk dibatalkan"
            />
            <StatCard
              icon={<Wallet size={18} />}
              label="Pendapatan"
              value={formatRupiah(stats.revenue)}
              hint="Dari pesanan yang pembayarannya sudah terverifikasi"
            />
            <StatCard
              icon={<Clock size={18} />}
              label="Pesanan aktif"
              value={String(stats.active)}
              hint="Belum selesai dan belum dibatalkan"
            />
            <StatCard
              icon={<Check size={18} />}
              label="Pesanan selesai"
              value={String(stats.done)}
              hint="Sudah dikirim dan selesai"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Pengiriman terdekat</h2>
                <Link
                  to="/jadwal"
                  className="text-sm font-medium text-sage-700 hover:underline"
                >
                  Lihat jadwal
                </Link>
              </div>

              {upcoming.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Belum ada pengiriman yang terkonfirmasi.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {upcoming.map((o) => (
                    <li key={o.id}>
                      <Link
                        to={`/pesanan/${o.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 hover:bg-sage-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {o.recipientName} · {o.totalPortions} porsi
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatTanggalSingkat(o.deliveryDate)},{' '}
                            {o.deliveryTimeSlot}
                          </p>
                        </div>
                        <StatusChip status={o.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 font-semibold">Pesanan per status</h2>
              <ul className="space-y-2">
                {ALL_STATUSES.map((s) => {
                  const count = stats.byStatus[s] ?? 0
                  return (
                    <li key={s}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{s}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-sage-500"
                          style={{ width: `${(count / maxStatusCount) * 100}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="rounded-xl border border-stone-200 bg-white p-5 lg:col-span-2">
              <h2 className="mb-3 font-semibold">Menu terlaris (porsi)</h2>
              {stats.topMenus.length === 0 ? (
                <p className="text-sm text-stone-500">Belum ada data.</p>
              ) : (
                <ol className="space-y-2">
                  {stats.topMenus.map(([name, portions], i) => (
                    <li
                      key={name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        <span className="mr-2 text-stone-400">{i + 1}.</span>
                        {name}
                      </span>
                      <span className="font-semibold">{portions} porsi</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <p className="mt-4 text-xs text-stone-500">
            Dihitung dari maksimal 500 pesanan terbaru.
          </p>
        </>
      )}
    </div>
  )
}