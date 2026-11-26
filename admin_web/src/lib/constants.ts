// ---------- Status pesanan ----------
export const ST_MENUNGGU_PEMBAYARAN = 'Menunggu Pembayaran'
export const ST_MENUNGGU_VERIFIKASI = 'Menunggu Verifikasi'
export const ST_DIKONFIRMASI = 'Dikonfirmasi'
export const ST_DIPROSES = 'Diproses'
export const ST_DIKIRIM = 'Dikirim'
export const ST_SELESAI = 'Selesai'
export const ST_DIBATALKAN = 'Dibatalkan'

/** Urutan normal status pesanan. */
export const STATUS_FLOW: string[] = [
  ST_MENUNGGU_PEMBAYARAN,
  ST_MENUNGGU_VERIFIKASI,
  ST_DIKONFIRMASI,
  ST_DIPROSES,
  ST_DIKIRIM,
  ST_SELESAI,
]

export const ALL_STATUSES: string[] = [...STATUS_FLOW, ST_DIBATALKAN]

/** Pesanan hanya boleh dibatalkan selama belum diproses. */
export const CANCELLABLE: string[] = [
  ST_MENUNGGU_PEMBAYARAN,
  ST_MENUNGGU_VERIFIKASI,
  ST_DIKONFIRMASI,
]

/** Pesanan yang belum selesai dan belum dibatalkan. */
export const ACTIVE_STATUSES: string[] = [
  ST_MENUNGGU_PEMBAYARAN,
  ST_MENUNGGU_VERIFIKASI,
  ST_DIKONFIRMASI,
  ST_DIPROSES,
  ST_DIKIRIM,
]

/** Pesanan yang pembayarannya sudah diverifikasi (dihitung sebagai pendapatan). */
export const REVENUE_STATUSES: string[] = [
  ST_DIKONFIRMASI,
  ST_DIPROSES,
  ST_DIKIRIM,
  ST_SELESAI,
]

/** Pesanan yang sudah pasti dan tinggal dikerjakan atau dikirim. */
export const UPCOMING_STATUSES: string[] = [
  ST_DIKONFIRMASI,
  ST_DIPROSES,
  ST_DIKIRIM,
]

/** Langkah berikutnya yang dilakukan admin lewat tombol satu klik. */
export const NEXT_STATUS: Record<string, string | undefined> = {
  [ST_DIKONFIRMASI]: ST_DIPROSES,
  [ST_DIPROSES]: ST_DIKIRIM,
  [ST_DIKIRIM]: ST_SELESAI,
}

export const NEXT_LABEL: Record<string, string | undefined> = {
  [ST_DIKONFIRMASI]: 'Mulai Proses',
  [ST_DIPROSES]: 'Tandai Dikirim',
  [ST_DIKIRIM]: 'Tandai Selesai',
}

// ---------- Status pembayaran ----------
export const PAY_MENUNGGU = 'Menunggu Verifikasi'
export const PAY_TERVERIFIKASI = 'Terverifikasi'
export const PAY_DITOLAK = 'Ditolak'

// ---------- Slot pengiriman ----------
// PENTING: harus sama dengan kDeliverySlots di aplikasi pelanggan
// (customer_app/lib/core/constants.dart).
export interface DeliverySlot {
  id: string
  label: string
}

export const DELIVERY_SLOTS: DeliverySlot[] = [
  { id: 's1', label: '08.00 - 10.00' },
  { id: 's2', label: '10.00 - 12.00' },
  { id: 's3', label: '12.00 - 14.00' },
]

/** Kuota porsi per slot per hari bila belum diatur khusus. */
export const DEFAULT_MAX_PORTIONS = 100