import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Order } from '../types'
import {
  CANCELLABLE,
  NEXT_STATUS,
  PAY_DITOLAK,
  PAY_TERVERIFIKASI,
  ST_DIBATALKAN,
  ST_DIKONFIRMASI,
  ST_MENUNGGU_PEMBAYARAN,
} from './constants'

/** Pembayaran diterima: pembayaran Terverifikasi, pesanan Dikonfirmasi. */
export async function verifyPayment(
  order: Order,
  adminUid: string,
): Promise<void> {
  const orderRef = doc(db, 'orders', order.id)
  const batch = writeBatch(db)

  batch.update(doc(db, 'payments', order.id), {
    status: PAY_TERVERIFIKASI,
    verifiedBy: adminUid,
    verifiedAt: serverTimestamp(),
  })

  batch.update(orderRef, { status: ST_DIKONFIRMASI })

  batch.set(doc(collection(orderRef, 'statusLogs')), {
    fromStatus: order.status,
    toStatus: ST_DIKONFIRMASI,
    changedBy: adminUid,
    changedAt: serverTimestamp(),
    note: 'Pembayaran diverifikasi admin',
  })

  await batch.commit()
}

/** Pembayaran ditolak: pesanan kembali ke Menunggu Pembayaran. */
export async function rejectPayment(
  order: Order,
  adminUid: string,
  reason: string,
): Promise<void> {
  const orderRef = doc(db, 'orders', order.id)
  const batch = writeBatch(db)

  batch.update(doc(db, 'payments', order.id), {
    status: PAY_DITOLAK,
    rejectionNote: reason,
    verifiedBy: adminUid,
    verifiedAt: serverTimestamp(),
  })

  batch.update(orderRef, { status: ST_MENUNGGU_PEMBAYARAN })

  batch.set(doc(collection(orderRef, 'statusLogs')), {
    fromStatus: order.status,
    toStatus: ST_MENUNGGU_PEMBAYARAN,
    changedBy: adminUid,
    changedAt: serverTimestamp(),
    note: `Pembayaran ditolak: ${reason}`,
  })

  await batch.commit()
}

/** Memajukan status satu langkah: Dikonfirmasi, Diproses, Dikirim, Selesai. */
export async function advanceStatus(
  order: Order,
  adminUid: string,
): Promise<void> {
  const next = NEXT_STATUS[order.status]
  if (!next) {
    throw new Error('Status ini tidak punya langkah berikutnya.')
  }

  const orderRef = doc(db, 'orders', order.id)
  const batch = writeBatch(db)

  batch.update(orderRef, { status: next })

  batch.set(doc(collection(orderRef, 'statusLogs')), {
    fromStatus: order.status,
    toStatus: next,
    changedBy: adminUid,
    changedAt: serverTimestamp(),
    note: '',
  })

  await batch.commit()
}

/**
 * Membatalkan pesanan dan mengembalikan kuota slot pengiriman.
 * Dijalankan sebagai transaksi supaya status dan kuota selalu konsisten.
 */
export async function cancelOrder(
  order: Order,
  adminUid: string,
  reason: string,
): Promise<void> {
  const orderRef = doc(db, 'orders', order.id)
  const hasSlot = order.deliveryDateKey !== '' && order.deliverySlotId !== ''
  const slotRef = doc(
    db,
    'deliverySlots',
    `${order.deliveryDateKey}_${order.deliverySlotId}`,
  )

  await runTransaction(db, async (tx) => {
    // Semua pembacaan dulu, baru penulisan.
    const orderSnap = await tx.get(orderRef)
    const slotSnap = hasSlot ? await tx.get(slotRef) : null

    const currentStatus = orderSnap.data()?.status as string | undefined
    if (!currentStatus || !CANCELLABLE.includes(currentStatus)) {
      throw new Error(
        'Pesanan sudah tidak bisa dibatalkan (status sudah berubah).',
      )
    }

    tx.update(orderRef, {
      status: ST_DIBATALKAN,
      cancelledAt: serverTimestamp(),
    })

    if (slotSnap && slotSnap.exists() && order.totalPortions > 0) {
      const used = Number(slotSnap.data().usedPortions ?? 0)
      tx.update(slotRef, {
        usedPortions: Math.max(0, used - order.totalPortions),
      })
    }

    tx.set(doc(collection(orderRef, 'statusLogs')), {
      fromStatus: currentStatus,
      toStatus: ST_DIBATALKAN,
      changedBy: adminUid,
      changedAt: serverTimestamp(),
      note: reason ? `Dibatalkan admin: ${reason}` : 'Pesanan dibatalkan admin',
    })
  })
}