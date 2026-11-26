import { useEffect, useState } from 'react'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Order } from '../types'
import { toOrder } from './mappers'

/** Berlangganan 500 pesanan terbaru secara real-time. */
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return { orders, loading, error }
}