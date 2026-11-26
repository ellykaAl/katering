import { NavLink } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useChats } from '../lib/chat'

/** Menu Chat di sidebar, dengan lencana jumlah pesan belum dibaca. */
export default function ChatNavLink({ onNavigate }: { onNavigate: () => void }) {
  const { chats } = useChats()
  const unread = chats.reduce((sum, c) => sum + c.unreadForAdmin, 0)

  return (
    <NavLink
      to="/chat"
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-sage-100 text-sage-700'
            : 'text-stone-600 hover:bg-stone-100'
        }`
      }
    >
      <MessageCircle size={18} />
      <span className="flex-1">Chat</span>
      {unread > 0 && (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </NavLink>
  )
}