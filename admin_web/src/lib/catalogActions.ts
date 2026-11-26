import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

export interface MenuInput {
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl: string
  isAvailable: boolean
  minOrder: number
}

// ---------- Menu ----------

export async function createMenu(input: MenuInput): Promise<void> {
  await addDoc(collection(db, 'menus'), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

export async function updateMenu(id: string, input: MenuInput): Promise<void> {
  await updateDoc(doc(db, 'menus', id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function setMenuAvailability(
  id: string,
  isAvailable: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'menus', id), {
    isAvailable,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Menghapus menu dari katalog. Pesanan lama tidak terpengaruh karena
 * setiap pesanan menyimpan salinan nama dan harga menu.
 */
export async function deleteMenu(id: string): Promise<void> {
  await deleteDoc(doc(db, 'menus', id))
}

// ---------- Kategori ----------

export async function createCategory(name: string): Promise<void> {
  await addDoc(collection(db, 'categories'), {
    name,
    createdAt: serverTimestamp(),
  })
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'categories', id), {
    name,
    updatedAt: serverTimestamp(),
  })
}

/** Kategori yang masih dipakai oleh menu tidak boleh dihapus. */
export async function deleteCategory(id: string): Promise<void> {
  const used = await getDocs(
    query(collection(db, 'menus'), where('categoryId', '==', id), limit(1)),
  )

  if (!used.empty) {
    throw new Error(
      'Kategori ini masih dipakai oleh menu. Pindahkan atau hapus menunya dulu.',
    )
  }

  await deleteDoc(doc(db, 'categories', id))
}