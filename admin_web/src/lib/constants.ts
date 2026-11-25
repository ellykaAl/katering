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