import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import {
  markChatReadByAdmin,
  sendAdminMessage,
  useChatMessages,
  useChats,
} from '../lib/chat'
import { formatTanggalWaktu } from '../lib/format'

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const { user } = useAuth()
  const adminUid = user?.uid ?? ''

  const { chats, loading: loadingChats, error: chatsError } = useChats()
  const { messages, loading: loadingMessages } = useChatMessages(chatId)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selected = chats.find((c) => c.id === chatId) ?? null
  const selectedUnread = selected?.unreadForAdmin ?? 0

  // Percakapan yang sedang dibuka dianggap sudah dibaca.
  useEffect(() => {
    if (chatId && selectedUnread > 0) {
      markChatReadByAdmin(chatId).catch(() => {
        // Diabaikan: lencana akan tetap tampil sampai berhasil.
      })
    }
  }, [chatId, selectedUnread])

  // Gulir ke pesan terbaru.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, chatId])

  async function handleSend() {
    const clean = text.trim()
    if (!chatId || !adminUid || !clean || sending) return

    if (clean.length > 1000) {
      setError('Pesan maksimal 1000 karakter.')
      return
    }

    setSending(true)
    setError(null)
    try {
      await sendAdminMessage(chatId, clean, adminUid)
      setText('')
    } catch (e) {
      setError(
        e instanceof Error ? `Gagal mengirim: ${e.message}` : 'Gagal mengirim pesan.',
      )
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void handleSend()
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Chat</h1>
      <p className="mb-4 text-sm text-stone-500">
        Percakapan dengan pelanggan, diperbarui otomatis.
      </p>

      {chatsError && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {chatsError}
        </p>
      )}

      <div className="flex h-[calc(100vh-11rem)] min-h-[420px] overflow-hidden rounded-xl border border-stone-200 bg-white">
        {/* Daftar percakapan */}
        <aside
          className={`${
            chatId ? 'hidden md:flex' : 'flex'
          } w-full flex-col border-r border-stone-200 md:w-80 md:shrink-0`}
        >
          <div className="flex-1 overflow-y-auto">
            {loadingChats && (
              <p className="p-4 text-sm text-stone-500">Memuat percakapan…</p>
            )}

            {!loadingChats && chats.length === 0 && (
              <p className="p-4 text-sm text-stone-500">
                Belum ada percakapan. Pesan dari pelanggan akan muncul di sini.
              </p>
            )}

            {chats.map((c) => {
              const active = c.id === chatId
              return (
                <Link
                  key={c.id}
                  to={`/chat/${c.id}`}
                  className={`block border-b border-stone-100 px-4 py-3 ${
                    active ? 'bg-sage-100' : 'hover:bg-sage-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{c.customerName}</p>
                    {c.unreadForAdmin > 0 && (
                      <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {c.unreadForAdmin}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-stone-600">
                    {c.lastSender === 'admin' ? 'Anda: ' : ''}
                    {c.lastMessage}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatTanggalWaktu(c.lastMessageAt)}
                  </p>
                </Link>
              )
            })}
          </div>
        </aside>

        {/* Isi percakapan */}
        <section
          className={`${
            chatId ? 'flex' : 'hidden md:flex'
          } min-w-0 flex-1 flex-col`}
        >
          {!chatId ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-stone-500">
              Pilih percakapan di sebelah kiri untuk mulai membalas.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
                <Link
                  to="/chat"
                  aria-label="Kembali ke daftar percakapan"
                  className="rounded p-1 hover:bg-stone-100 md:hidden"
                >
                  <ArrowLeft size={20} />
                </Link>
                <p className="truncate font-semibold">
                  {selected?.customerName ?? 'Percakapan'}
                </p>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto bg-cream p-4">
                {loadingMessages && (
                  <p className="text-sm text-stone-500">Memuat pesan…</p>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <p className="text-sm text-stone-500">Belum ada pesan.</p>
                )}

                {messages.map((m) => {
                  const fromAdmin = m.senderRole === 'admin'
                  return (
                    <div
                      key={m.id}
                      className={`flex ${fromAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          fromAdmin
                            ? 'bg-sage-600 text-white'
                            : 'border border-stone-200 bg-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {m.text}
                        </p>
                        <p
                          className={`mt-1 text-[11px] ${
                            fromAdmin ? 'text-white/70' : 'text-stone-400'
                          }`}
                        >
                          {m.createdAt
                            ? formatTanggalWaktu(m.createdAt)
                            : 'Mengirim…'}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-stone-200 bg-white p-3"
              >
                {error && (
                  <p className="mb-2 text-sm text-red-700">{error}</p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void handleSend()
                      }
                    }}
                    rows={2}
                    maxLength={1000}
                    placeholder="Tulis balasan… (Enter untuk kirim, Shift+Enter baris baru)"
                    className="flex-1 resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-sage-600"
                  />
                  <button
                    type="submit"
                    disabled={sending || text.trim() === ''}
                    aria-label="Kirim"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-sage-600 px-4 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-50"
                  >
                    <Send size={16} />
                    {sending ? 'Mengirim…' : 'Kirim'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}