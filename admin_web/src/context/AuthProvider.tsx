import { useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setAdminName('')
        setLoading(false)
        return
      }

      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        const data = snap.data()

        if (data?.role === 'admin') {
          setUser(firebaseUser)
          setAdminName(
            typeof data.name === 'string' && data.name
              ? data.name
              : (firebaseUser.email ?? 'Admin'),
          )
          setError(null)
        } else {
          setError('Akun ini bukan admin. Gunakan akun admin untuk masuk.')
          await signOut(auth)
        }
      } catch {
        setError('Gagal memeriksa peran akun. Coba lagi.')
        await signOut(auth)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function login(email: string, password: string) {
    setError(null)
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, adminName, loading, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}