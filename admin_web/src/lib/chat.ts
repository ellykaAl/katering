import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export interface ChatSummary {
  id: string
  customerName: string
  lastMessage: string
  lastSender: string
  lastMessageAt: Date | null
  unreadForAdmin: number
}

export interface ChatMessage {
  id: string
  text: string
  senderRole: string
  createdAt: Date | null
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number => (typeof v === 'number' ? v : 0)

function toDate(value: unknown): Date | null {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate()
  }
  return null
}

function toChat(id: string, d: DocumentData): ChatSummary {
  return {
    id,
    customerName: str(d.customerName) || 'Pelanggan',
    lastMessage: str(d.lastMessage),
    lastSender: str(d.lastSender),
    lastMessageAt: toDate(d.lastMessageAt),
    unreadForAdmin: num(d.unreadForAdmin),
  }
}

function toMessage(id: string, d: DocumentData): ChatMessage {
  return {
    id,
    text: str(d.text),
    senderRole: str(d.senderRole),
    createdAt: toDate(d.createdAt),
  }
}

/** Daftar percakapan, yang terbaru di atas, secara real-time. */
export function useChats() {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      orderBy('lastMessageAt', 'desc'),
      limit(100),
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setChats(snap.docs.map((d) => toChat(d.id, d.data())))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(`Gagal memuat chat: ${err.message}`)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { chats, loading, error }
}

/** Pesan pada satu percakapan (200 terakhir), urut dari yang terlama. */
export function useChatMessages(chatId: string | undefined) {
  const [state, setState] = useState<{
    chatId: string
    messages: ChatMessage[]
  } | null>(null)

  useEffect(() => {
    if (!chatId) return undefined

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(200),
    )

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => toMessage(d.id, d.data()))
        setState({ chatId, messages: list.reverse() })
      },
      () => setState({ chatId, messages: [] }),
    )
  }, [chatId])

  const ready = chatId !== undefined && state?.chatId === chatId

  return {
    messages: ready && state ? state.messages : [],
    loading: chatId !== undefined && !ready,
  }
}

/** Admin membalas pelanggan. */
export async function sendAdminMessage(
  chatId: string,
  text: string,
  adminUid: string,
): Promise<void> {
  const chatRef = doc(db, 'chats', chatId)
  const messageRef = doc(collection(chatRef, 'messages'))
  const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text

  const batch = writeBatch(db)

  batch.set(messageRef, {
    text,
    senderId: adminUid,
    senderRole: 'admin',
    createdAt: serverTimestamp(),
  })

  batch.set(
    chatRef,
    {
      lastMessage: preview,
      lastSender: 'admin',
      lastMessageAt: serverTimestamp(),
      unreadForCustomer: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  await batch.commit()
}

/** Admin membuka percakapan: semua pesan pelanggan dianggap sudah dibaca. */
export async function markChatReadByAdmin(chatId: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), { unreadForAdmin: 0 })
}