import type { DocumentData, Timestamp } from 'firebase/firestore'
import type { Order, OrderItem, Payment, StatusLog } from '../types'

function toDate(value: unknown): Date | null {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate()
  }
  return null
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number => (typeof v === 'number' ? v : 0)

export function toOrder(id: string, d: DocumentData): Order {
  const rawItems: unknown[] = Array.isArray(d.items) ? d.items : []

  const items: OrderItem[] = rawItems.map((raw) => {
    const m = (raw ?? {}) as Record<string, unknown>
    return {
      menuId: str(m.menuId),
      name: str(m.name),
      price: num(m.price),
      quantity: num(m.quantity),
      subtotal: num(m.subtotal),
    }
  })

  return {
    id,
    orderNumber: str(d.orderNumber),
    customerId: str(d.customerId),
    recipientName: str(d.recipientName),
    recipientPhone: str(d.recipientPhone),
    address: str(d.address),
    notes: str(d.notes),
    deliveryDate: toDate(d.deliveryDate),
    deliveryDateKey: str(d.deliveryDateKey),
    deliverySlotId: str(d.deliverySlotId),
    deliveryTimeSlot: str(d.deliveryTimeSlot),
    items,
    totalPortions: num(d.totalPortions),
    totalAmount: num(d.totalAmount),
    status: str(d.status),
    createdAt: toDate(d.createdAt),
  }
}

export function toPayment(id: string, d: DocumentData): Payment {
  return {
    id,
    status: str(d.status),
    senderName: str(d.senderName),
    proofBase64: str(d.proofBase64),
    mimeType: str(d.mimeType),
    rejectionNote: str(d.rejectionNote),
    amount: num(d.amount),
    submittedAt: toDate(d.submittedAt),
  }
}

export function toLog(id: string, d: DocumentData): StatusLog {
  return {
    id,
    fromStatus: str(d.fromStatus),
    toStatus: str(d.toStatus),
    note: str(d.note),
    changedAt: toDate(d.changedAt),
  }
}