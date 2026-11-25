import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { ArrowLeft, Ban, Check, MessageCircle, X } from 'lucide-react'
import { db } from '../firebase'
import { useAuth } from '../context/useAuth'
import type { Order, Payment, StatusLog } from '../types'
import { toLog, toOrder, toPayment } from '../lib/mappers'
import {
  CANCELLABLE,
  NEXT_LABEL,
  NEXT_STATUS,
  PAY_MENUNGGU,
  ST_MENUNGGU_VERIFIKASI,
} from '../lib/constants'
import {
  formatRupiah,
  formatTanggal,
  formatTanggalWaktu,
  whatsappLink,
} from '../lib/format'
import {
  advanceStatus,
  cancelOrder,
  rejectPayment,
  verifyPayment,
} from '../lib/orderActions'
import StatusChip from '../components/StatusChip'
import Modal from '../components/Modal'

type DialogKind = 'reject' | 'cancel' | 'zoom' | null

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-1.5 text-sm">
      <span className="w-28 shrink-0 text-stone-500">{label}</span>
      <span className="min-w-0 flex-1 break-words font-medium">{value}</span>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const adminUid = user?.uid ?? ''

  const [order, setOrder] = useState<Order | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [logs, setLogs] = useState<StatusLog[]>([])
  const [loading, setLoading] = useState(true)

  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [dialog, setDialog] = useState<DialogKind>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!id) return

    const unsubOrder = onSnapshot(
      doc(db, 'orders', id),
      (snap) => {
        setOrder(snap.exists() ? toOrder(snap.id, snap.data()) : null)
        setLoading(false)
      },
      (err) => {
        setError(`Gagal memuat pesanan: ${err.message}`)
        setLoading(false)
      },
    )

    const unsubPayment = onSnapshot(
      doc(db, 'payments', id),
      (snap) => {
        setPayment(snap.exists() ? toPayment(snap.id, snap.data()) : null)
      },
      () => setPayment(null),
    )

    const unsubLogs = onSnapshot(
      query(
        collection(db, 'orders', id, 'statusLogs'),
        orderBy('changedAt', 'asc'),
      ),
      (snap) => setLogs(snap.docs.map((d) => toLog(d.id, d.data()))),
      () => setLogs([]),
    )

    return () => {
      unsubOrder()
      unsubPayment()
      unsubLogs()
    }
  }, [id])

  async function run(
    label: string,
    action: () => Promise<void>,
    successMessage: string,
  ) {
    setBusy(label)
    setError(null)
    setNotice(null)
    try {
      await action()
      setNotice(successMessage)
      setDialog(null)
      setReason('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.')
    } finally {
      setBusy(null)
    }
  }

  function closeDialog() {
    if (busy) return
    setDialog(null)
    setReason('')
  }

  if (loading) {
    return <p className="text-stone-500">Memuat pesanan…</p>
  }

  if (!order) {
    return (
      <div>
        <Link
          to="/pesanan"
          className="mb-4 inline-flex items-center gap-1 text-sm text-sage-700 hover:underline"
        >
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <p className="text-stone-600">Pesanan tidak ditemukan.</p>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    )
  }

  const needsVerification =
    order.status === ST_MENUNGGU_VERIFIKASI &&
    payment !== null &&
    payment.status === PAY_MENUNGGU

  const nextStatus = NEXT_STATUS[order.status]
  const nextLabel = NEXT_LABEL[order.status]
  const canCancel = CANCELLABLE.includes(order.status)
  const amountMismatch = payment !== null && payment.amount !== order.totalAmount

  const proofSrc =
    payment && payment.proofBase64
      ? `data:${payment.mimeType || 'image/jpeg'};base64,${payment.proofBase64}`
      : null

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/pesanan"
        className="mb-4 inline-flex items-center gap-1 text-sm text-sage-700 hover:underline"
      >
        <ArrowLeft size={16} /> Kembali ke daftar
      </Link>

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-5">
        <div>
          <p className="text-xs text-stone-500">Nomor pesanan</p>
          <h1 className="text-xl font-bold">{order.orderNumber}</h1>
          <p className="text-xs text-stone-500">
            Dibuat {formatTanggalWaktu(order.createdAt)}
          </p>
        </div>
        <StatusChip status={order.status} />
      </div>

      {notice && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Kolom kiri */}
        <div className="space-y-4 lg:col-span-3">
          {/* Pembayaran */}
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Pembayaran</h2>
              {payment && <StatusChip status={payment.status} />}
            </div>

            {!payment && (
              <p className="text-sm text-stone-500">
                Pelanggan belum mengirim bukti pembayaran.
              </p>
            )}

            {payment && (
              <>
                <InfoRow label="Nama pengirim" value={payment.senderName || '-'} />
                <InfoRow label="Jumlah" value={formatRupiah(payment.amount)} />
                <InfoRow
                  label="Dikirim"
                  value={formatTanggalWaktu(payment.submittedAt)}
                />
                {payment.rejectionNote && (
                  <InfoRow label="Alasan tolak" value={payment.rejectionNote} />
                )}

                {amountMismatch && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Jumlah pada bukti ({formatRupiah(payment.amount)}) berbeda
                    dengan total pesanan ({formatRupiah(order.totalAmount)}).
                  </p>
                )}

                {proofSrc && (
                  <button
                    type="button"
                    onClick={() => setDialog('zoom')}
                    className="mt-3 block w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
                    title="Klik untuk memperbesar"
                  >
                    <img
                      src={proofSrc}
                      alt="Bukti pembayaran"
                      className="mx-auto max-h-72 object-contain"
                    />
                  </button>
                )}
              </>
            )}

            {needsVerification && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    run(
                      'verify',
                      () => verifyPayment(order, adminUid),
                      'Pembayaran diverifikasi. Pesanan berstatus Dikonfirmasi.',
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
                >
                  <Check size={16} />
                  {busy === 'verify' ? 'Memproses…' : 'Verifikasi Pembayaran'}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => setDialog('reject')}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  <X size={16} />
                  Tolak
                </button>
              </div>
            )}
          </section>

          {/* Tindakan status */}
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Tindakan</h2>

            {nextStatus && nextLabel && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  run(
                    'advance',
                    () => advanceStatus(order, adminUid),
                    `Status diubah menjadi ${nextStatus}.`,
                  )
                }
                className="mr-3 rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
              >
                {busy === 'advance' ? 'Memproses…' : `${nextLabel} → ${nextStatus}`}
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setDialog('cancel')}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <Ban size={16} />
                Batalkan Pesanan
              </button>
            )}

            {!nextStatus && !canCancel && (
              <p className="text-sm text-stone-500">
                {order.status === 'Selesai'
                  ? 'Pesanan sudah selesai.'
                  : order.status === 'Dibatalkan'
                    ? 'Pesanan ini dibatalkan.'
                    : 'Tidak ada tindakan untuk status ini.'}
              </p>
            )}

            {order.status === 'Menunggu Pembayaran' && (
              <p className="mt-3 text-sm text-stone-500">
                Menunggu pelanggan mengirim bukti pembayaran.
              </p>
            )}
            {order.status === ST_MENUNGGU_VERIFIKASI && !needsVerification && (
              <p className="mt-3 text-sm text-stone-500">
                Data pembayaran belum lengkap, jadi verifikasi belum tersedia.
              </p>
            )}
          </section>

          {/* Rincian */}
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Rincian pesanan</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <tr>
                    <th className="py-2">Menu</th>
                    <th className="py-2 text-right">Harga</th>
                    <th className="py-2 text-right">Jumlah</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={`${item.menuId}-${i}`} className="border-b border-stone-100">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-right">{formatRupiah(item.price)}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-stone-500">
                Total ({order.totalPortions} porsi)
              </span>
              <span className="text-lg font-bold">
                {formatRupiah(order.totalAmount)}
              </span>
            </div>
          </section>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Pengiriman</h2>
            <InfoRow label="Tanggal" value={formatTanggal(order.deliveryDate)} />
            <InfoRow label="Jam" value={order.deliveryTimeSlot || '-'} />
            <InfoRow label="Penerima" value={order.recipientName || '-'} />
            <InfoRow label="Telepon" value={order.recipientPhone || '-'} />
            <InfoRow label="Alamat" value={order.address || '-'} />
            {order.notes && <InfoRow label="Catatan" value={order.notes} />}

            {order.recipientPhone && (
              <a
                href={whatsappLink(order.recipientPhone)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100"
              >
                <MessageCircle size={16} />
                Hubungi via WhatsApp
              </a>
            )}
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Riwayat status</h2>
            <ol className="space-y-3">
              <li>
                <p className="text-sm font-medium">Pesanan dibuat</p>
                <p className="text-xs text-stone-500">
                  {formatTanggalWaktu(order.createdAt)}
                </p>
              </li>
              {logs.map((log) => (
                <li key={log.id}>
                  <p className="text-sm font-medium">{log.toStatus}</p>
                  <p className="text-xs text-stone-500">
                    {formatTanggalWaktu(log.changedAt)}
                  </p>
                  {log.note && (
                    <p className="text-xs text-stone-500">{log.note}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Dialog tolak pembayaran */}
      {dialog === 'reject' && (
        <Modal title="Tolak pembayaran" onClose={closeDialog}>
          <p className="mb-3 text-sm text-stone-600">
            Alasan ini akan terlihat oleh pelanggan, dan pesanan kembali ke
            status Menunggu Pembayaran supaya pelanggan bisa mengirim ulang
            bukti.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Contoh: Nominal tidak sesuai"
            className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-sage-600"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={busy !== null || reason.trim().length < 3}
              onClick={() =>
                run(
                  'reject',
                  () => rejectPayment(order, adminUid, reason.trim()),
                  'Pembayaran ditolak. Pelanggan diminta mengirim ulang bukti.',
                )
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy === 'reject' ? 'Memproses…' : 'Tolak Pembayaran'}
            </button>
          </div>
        </Modal>
      )}

      {/* Dialog batalkan pesanan */}
      {dialog === 'cancel' && (
        <Modal title="Batalkan pesanan" onClose={closeDialog}>
          <p className="mb-3 text-sm text-stone-600">
            Kuota {order.totalPortions} porsi pada slot {order.deliveryTimeSlot}{' '}
            akan dikembalikan. Pembatalan tidak bisa diurungkan. Jika pelanggan
            sudah membayar, kembalikan dananya secara manual.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Alasan pembatalan (opsional)"
            className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-sage-600"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
            >
              Kembali
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run(
                  'cancel',
                  () => cancelOrder(order, adminUid, reason.trim()),
                  'Pesanan dibatalkan dan kuota slot dikembalikan.',
                )
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy === 'cancel' ? 'Memproses…' : 'Ya, Batalkan'}
            </button>
          </div>
        </Modal>
      )}

      {/* Pratinjau bukti pembayaran */}
      {dialog === 'zoom' && proofSrc && (
        <Modal title="Bukti pembayaran" onClose={closeDialog} wide>
          <img
            src={proofSrc}
            alt="Bukti pembayaran"
            className="mx-auto max-h-[75vh] object-contain"
          />
        </Modal>
      )}
    </div>
  )
}