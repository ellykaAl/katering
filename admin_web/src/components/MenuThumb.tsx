import { useState } from 'react'
import { Utensils } from 'lucide-react'

interface MenuThumbProps {
  url: string
  className?: string
}

/** Foto menu dengan ikon pengganti bila tautan kosong atau gagal dimuat. */
export default function MenuThumb({
  url,
  className = 'h-12 w-12',
}: MenuThumbProps) {
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400 ${className}`}
      >
        <Utensils size={18} />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg object-cover ${className}`}
    />
  )
}