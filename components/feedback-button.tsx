"use client"

import { useState } from "react"
import Link from "next/link"

export function FeedbackButton() {
  const [minimized, setMinimized] = useState(false)

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-20 right-4 z-50 grid h-10 w-10 place-items-center rounded-full bg-candy shadow-girly-pop text-lg active:scale-95"
        aria-label="Open feedback"
      >
        💌
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-candy px-4 py-2.5 shadow-girly-pop">
      <Link
        href="/feedback"
        className="text-sm font-bold text-white"
      >
        Share feedback 💗
      </Link>
      <button
        onClick={() => setMinimized(true)}
        className="text-white/70 text-xs active:scale-90"
        aria-label="Minimize"
      >
        ✕
      </button>
    </div>
  )
}
