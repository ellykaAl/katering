import { useEffect, useState, type FormEvent } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/useAuth'

export default function SettingsPage() {
  const { user } = useAuth()

  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getDoc(doc(db, 'settings', 'payment'))
      .then((snap) => {
        if (cancelled) return
        const data = snap.data()
        if (data) {
          setBankName(String(data.bankName ?? ''))
          setAccountNumber(String(data.accountNumber ?? ''))
          setAccountHolder(String(data.accountHolder ?? ''))
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(
          e instanceof Error
            ? `Gagal memuat pengaturan: ${e.message}`
            : 'Gagal memuat pengaturan.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    const bank = bankName.trim()
    const number = accountNumber.trim()
    const holder = accountHolder.trim()

    if (!bank || !number || !holder) {
      setError('Nama bank, nomor rekening, dan nama pemilik wajib diisi.')
      return
    }
    if (!/^[0-9 .-]{5,30}$/.test(number)) {
      setError(
        'Nomor rekening hanya boleh berisi angka (spasi dan tanda hubung boleh), 5 sampai 30 karakter.',
      )
      return
    }

    setSaving(true)
    try {
      await setDoc(
        doc(db, 'settings', 'payment'),
        {
          bankName: bank,
          accountNumber: number,
          accountHolder: holder,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? '',
        },
        { merge: true },
      )
      setBankName(bank)
      setAccountNumber(number)
      setAccountHolder(holder)
      setNotice('Pengaturan tersimpan. Pelanggan langsung melihat rekening yang baru.')
    } catch (err) {
      setError(
        err instanceof Error
          ? `Gagal menyimpan: ${err.message}`
          : 'Gagal menyimpan pengaturan.',
      )
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100'

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <p className="mb-5 text-sm text-stone-500">
        Informasi yang tampil ke pelanggan saat membayar.
      </p>

      {loading ? (
        <p className="text-stone-500">Memuat…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-5">
          <form
            onSubmit={handleSave}
            className="rounded-xl border border-stone-200 bg-white p-5 md:col-span-3"
          >
            <h2 className="mb-4 font-semibold">Rekening tujuan transfer</h2>

            <label className="mb-1 block text-sm font-medium" htmlFor="bank">
              Nama bank atau e-wallet
            </label>
            <input
              id="bank"
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Contoh: BCA"
              className={`${inputClass} mb-4`}
            />

            <label className="mb-1 block text-sm font-medium" htmlFor="number">
              Nomor rekening
            </label>
            <input
              id="number"
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className={`${inputClass} mb-4`}
            />

            <label className="mb-1 block text-sm font-medium" htmlFor="holder">
              Nama pemilik rekening
            </label>
            <input
              id="holder"
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className={`${inputClass} mb-4`}
            />

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {notice && (
              <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sage-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </form>

          <aside className="space-y-4 md:col-span-2">
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 font-semibold">Tampilan di aplikasi pelanggan</h2>
              <div className="rounded-lg bg-black/5 p-3">
                <p className="font-semibold">{bankName || '(nama bank)'}</p>
                <p className="text-lg font-bold">
                  {accountNumber || '(nomor rekening)'}
                </p>
                <p className="text-sm">a.n. {accountHolder || '(nama pemilik)'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">
              <h2 className="mb-2 font-semibold text-stone-800">
                Pengaturan lain
              </h2>
              <p>
                Kuota porsi per tanggal dan slot diubah di halaman{' '}
                <span className="font-medium">Jadwal Pengiriman</span>, lewat
                tombol "Ubah kuota".
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}