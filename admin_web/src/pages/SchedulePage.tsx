import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Order } from '../types'
import { toOrder } from '../lib/mappers'
import { dateKey } from '../lib/format'
import DailyView from '../components/DailyView'
import MonthCalendar from '../components/MonthCalendar'

type ViewMode = 'harian' | 'kalender'

export default function SchedulePage() {
  const [view, setView] = useState<ViewMode>('harian')
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [calendarMonth, setCalendarMonth] = useState(() =>
    dateKey(new Date()).slice(0, 7),
  )

  const [orders, setOrders] = useState<Order[]>([])
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Bulan yang datanya dimuat mengikuti tampilan yang sedang aktif.
  const queryMonth =
    view === 'kalender' ? calendarMonth : selectedDate.slice(0, 7)

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('deliveryDateKey', '>=', `${queryMonth}-01`),
      where('deliveryDateKey', '<=', `${queryMonth}-31`),
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => toOrder(d.id, d.data())))
        setLoadedMonth(queryMonth)
        setError(null)
      },
      (err) => {
        setError(`Gagal memuat jadwal: ${err.message}`)
        setLoadedMonth(queryMonth)
      },
    )

    return unsubscribe
  }, [queryMonth])

  const loading = loadedMonth !== queryMonth

  function showCalendar() {
    setCalendarMonth(selectedDate.slice(0, 7))
    setView('kalender')
  }

  function pickDateFromCalendar(key: string) {
    setSelectedDate(key)
    setView('harian')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Jadwal Pengiriman</h1>
      <p className="mb-5 text-sm text-stone-500">
        Pesanan yang harus dikirim, dikelompokkan per tanggal dan jam.
      </p>

      <div className="mb-5 inline-flex rounded-lg border border-stone-300 bg-white p-1">
        <button
          type="button"
          onClick={() => setView('harian')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${
            view === 'harian'
              ? 'bg-sage-600 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Harian
        </button>
        <button
          type="button"
          onClick={showCalendar}
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${
            view === 'kalender'
              ? 'bg-sage-600 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Kalender
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {view === 'harian' ? (
        <DailyView
          date={selectedDate}
          orders={orders}
          loading={loading}
          onChangeDate={setSelectedDate}
        />
      ) : (
        <MonthCalendar
          month={calendarMonth}
          orders={orders}
          loading={loading}
          selectedDate={selectedDate}
          onSelectDate={pickDateFromCalendar}
          onChangeMonth={setCalendarMonth}
        />
      )}
    </div>
  )
}