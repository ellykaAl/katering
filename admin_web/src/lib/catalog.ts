import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'

export interface Category {
  id: string
  name: string
}

export interface Menu {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl: string
  isAvailable: boolean
  minOrder: number
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number => (typeof v === 'number' ? v : 0)

export function toCategory(id: string, d: DocumentData): Category {
  return { id, name: str(d.name) }
}

export function toMenu(id: string, d: DocumentData): Menu {
  return {
    id,
    categoryId: str(d.categoryId),
    name: str(d.name),
    description: str(d.description),
    price: num(d.price),
    imageUrl: str(d.imageUrl),
    isAvailable: d.isAvailable === true,
    minOrder: num(d.minOrder) || 1,
  }
}

/** Daftar kategori secara real-time, urut berdasarkan nama. */
export function useCategories() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name'))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => toCategory(d.id, d.data())))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(`Gagal memuat kategori: ${err.message}`)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { items, loading, error }
}

/** Daftar menu secara real-time, urut berdasarkan nama. */
export function useMenus() {
  const [items, setItems] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'menus'), orderBy('name'))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => toMenu(d.id, d.data())))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(`Gagal memuat menu: ${err.message}`)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { items, loading, error }
}