import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../context/useAuth'

function translateError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau password salah.'
    case 'auth/invalid-email':
      return 'Format email tidak valid.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.'
    default:
      return 'Gagal masuk. Coba lagi.'
  }
}

export default function LoginPage() {
  const { user, loading, error: authError, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)

    if (!email.includes('@')) {
      setLocalError('Email tidak valid.')
      return
    }
    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter.')
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setLocalError(
        err instanceof FirebaseError
          ? translateError(err.code)
          : 'Gagal masuk. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const message = localError ?? authError

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-sage-700">Admin Katering</h1>
        <p className="mb-6 mt-1 text-sm text-stone-500">
          Masuk untuk mengelola pesanan.
        </p>

        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
        />

        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
        />

        {message && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-sage-600 px-4 py-2.5 font-semibold text-white hover:bg-sage-700 disabled:opacity-60"
        >
          {submitting ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}