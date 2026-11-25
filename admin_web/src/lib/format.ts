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