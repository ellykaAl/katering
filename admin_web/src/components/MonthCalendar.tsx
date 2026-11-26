import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Order } from '../types'
import { ST_DIBATALKAN } from '../lib/constants'
import {
  addMonthsToKey,
  dateKey,
  daysInMonth,
  firstWeekdayMondayFirst,
  formatBulan,
} from '../lib/format'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

interface MonthCalendarProps {
  month: string // "YYYY-MM"
  orders: Order[]
  loading: boolean
  selectedDate: string
  onSelectDate: (key: string) => void
  onChangeMonth: (month: string) => void
}

export default function MonthCalendar({
  month,
  orders,
  loading,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: MonthCalendarProps) {
  const [todayKey] = useState(() => dateKey(new Date()))

  // Jumlah pesanan dan porsi per hari (pesanan dibatalkan tidak dihitung).
  const perDay = useMemo(() => {
    const map = new Map<string, { count: number; portions: number }>()
    for (const o of orders) {
      if (o.status === ST_DIBATALKAN) continue
      const current = map.get(o.deliveryDateKey) ?? { count: 0, portions: 0 }
      current.count += 1
      current.portions += o.totalPortions
      map.set(o.deliveryDateKey, current)
    }
    return map
  }, [orders])

  const blanks = firstWeekdayMondayFirst(month)
  const total = daysInMonth(month)

  const cells: Array<number | null> = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChangeMonth(addMonthsToKey(month, -1))}
          aria-label="Bulan sebelumnya"
          className="rounded-lg border border-stone-300 p-2 hover:bg-stone-100"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold capitalize">
          {formatBulan(month)}
        </h2>
        <button
          type="button"
          onClick={() => onChangeMonth(addMonthsToKey(month, 1))}
          aria-label="Bulan berikutnya"
          className="rounded-lg border border-stone-300 p-2 hover:bg-stone-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading && (
        <p className="mb-2 text-center text-xs text-stone-500">Memuat…</p>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} />
          }

          const key = `${month}-${String(day).padStart(2, '0')}`
          const info = perDay.get(key)
          const isToday = key === todayKey
          const isSelected = key === selectedDate

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`flex min-h-16 flex-col items-center rounded-lg border p-1 text-xs transition-colors sm:min-h-20 sm:p-2 ${
                isSelected
                  ? 'border-sage-600 bg-sage-100'
                  : info
                    ? 'border-sage-100 bg-sage-50 hover:bg-sage-100'
                    : 'border-stone-100 hover:bg-stone-50'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                  isToday ? 'bg-sage-600 font-bold text-white' : ''
                }`}
              >
                {day}
              </span>
              {info && (
                <>
                  <span className="mt-1 font-semibold text-sage-700">
                    {info.count} pesanan
                  </span>
                  <span className="hidden text-stone-500 sm:block">
                    {info.portions} porsi
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-stone-500">
        Klik sebuah tanggal untuk melihat rincian pengirimannya.
      </p>
    </div>
  )
}