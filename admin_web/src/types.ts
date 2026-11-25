export interface OrderItem {
  menuId: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  recipientName: string
  recipientPhone: string
  address: string
  notes: string
  deliveryDate: Date | null
  deliveryDateKey: string
  deliverySlotId: string
  deliveryTimeSlot: string
  items: OrderItem[]
  totalPortions: number
  totalAmount: number
  status: string
  createdAt: Date | null
}

export interface Payment {
  id: string
  status: string
  senderName: string
  proofBase64: string
  mimeType: string
  rejectionNote: string
  amount: number
  submittedAt: Date | null
}

export interface StatusLog {
  id: string
  fromStatus: string
  toStatus: string
  note: string
  changedAt: Date | null
}