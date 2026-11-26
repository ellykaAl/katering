import { doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Mengatur kuota maksimal porsi untuk satu slot pada satu tanggal.
 * Porsi yang sudah terpakai tidak berubah, dan kuota tidak boleh
 * lebih kecil dari porsi yang sudah terpakai.
 */
export async function setSlotQuota(
  dateKey: string,
  slotId: string,
  maxPortions: number,
): Promise<void> {
  const ref = doc(db, 'deliverySlots', `${dateKey}_${slotId}`)

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)

    if (snap.exists()) {
      const used = Number(snap.data().usedPortions ?? 0)
      if (maxPortions < used) {
        throw new Error(
          `Kuota tidak boleh di bawah porsi yang sudah terpakai (${used}).`,
        )
      }
      tx.update(ref, { maxPortions, usedPortions: used })
    } else {
      // usedPortions wajib ada supaya aplikasi pelanggan bisa menambahnya.
      tx.set(ref, { maxPortions, usedPortions: 0 })
    }
  })
}