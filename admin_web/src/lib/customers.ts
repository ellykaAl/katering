import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  createdAt: Date | null
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

function toCustomer(id: string, d: DocumentData): Customer {
  const created = d.createdAt as Timestamp | undefined
  return {
    id,
    name: str(d.name),
    email: str(d.email),
    phone: str(d.phone),
    createdAt:
      created && typeof created.toDate === 'function' ? created.toDate() : null,
  }
}

/** Semua akun berperan pelanggan, secara real-time. */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'customer'))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setCustomers(snap.docs.map((d) => toCustomer(d.id, d.data())))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(`Gagal memuat pelanggan: ${err.message}`)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { customers, loading, error }
}