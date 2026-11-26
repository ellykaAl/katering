const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const tanggalPanjang = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const tanggalSingkat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const tanggalWaktu = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const bulanTahun = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
})

export function formatRupiah(amount: number): string {
  return rupiah.format(amount)
}

export function formatTanggal(date: Date | null): string {
  return date ? tanggalPanjang.format(date) : '-'
}

export function formatTanggalSingkat(date: Date | null): string {
  return date ? tanggalSingkat.format(date) : '-'
}

export function formatTanggalWaktu(date: Date | null): string {
  return date ? tanggalWaktu.format(date) : '-'
}

/** Mengubah nomor telepon Indonesia menjadi tautan WhatsApp. */
export function whatsappLink(phone: string): string {
  let p = phone.replace(/[^\d+]/g, '')
  if (p.startsWith('+')) {
    p = p.slice(1)
  } else if (p.startsWith('0')) {
    p = '62' + p.slice(1)
  }
  return `https://wa.me/${p}`
}

// ---------- Tanggal berbasis kunci "YYYY-MM-DD" (waktu lokal) ----------

/** Date -> "YYYY-MM-DD" memakai zona waktu perangkat (bukan UTC). */
export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "YYYY-MM-DD" -> Date pada tengah malam waktu lokal. */
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysToKey(key: string, days: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + days)
  return dateKey(d)
}

/** Bulan dalam format "YYYY-MM". */
export function addMonthsToKey(month: string, months: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + months, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatBulan(month: string): string {
  return bulanTahun.format(parseKey(`${month}-01`))
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Hari pertama bulan, dengan Senin = 0 dan Minggu = 6. */
export function firstWeekdayMondayFirst(month: string): number {
  const day = parseKey(`${month}-01`).getDay()
  return (day + 6) % 7
}