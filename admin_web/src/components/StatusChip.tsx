const STYLES: Record<string, string> = {
  'Menunggu Pembayaran': 'bg-orange-50 text-orange-700 border-orange-200',
  'Menunggu Verifikasi': 'bg-blue-50 text-blue-700 border-blue-200',
  Dikonfirmasi: 'bg-teal-50 text-teal-700 border-teal-200',
  Terverifikasi: 'bg-teal-50 text-teal-700 border-teal-200',
  Diproses: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Dikirim: 'bg-purple-50 text-purple-700 border-purple-200',
  Selesai: 'bg-green-50 text-green-700 border-green-200',
  Dibatalkan: 'bg-red-50 text-red-700 border-red-200',
  Ditolak: 'bg-red-50 text-red-700 border-red-200',
}

export default function StatusChip({ status }: { status: string }) {
  const style = STYLES[status] ?? 'bg-stone-100 text-stone-700 border-stone-200'

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {status}
    </span>
  )
}