"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import { disableReminders, enableReminders, isPushSupported, isSubscribed } from "@/lib/push"

/** A cute toggle to turn on free daily reminders (web push). */
export function ReminderToggle() {
  const { user } = useAuth()
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [supported, setSupported] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    setSupported(isPushSupported())
    isSubscribed().then(setOn)
  }, [])

  async function toggle() {
    setBusy(true)
    setMsg(null)
    if (on) {
      await disableReminders()
      setOn(false)
    } else {
      const r = await enableReminders({ hour: 19, userId: user?.id })
      if (r.ok) {
        setOn(true)
        setMsg("You're set! We'll send a gentle nudge each evening.")
      } else {
        setMsg(r.error ?? "Couldn't turn that on.")
      }
    }
    setBusy(false)
  }

  return (
    <section className="rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-cute text-base font-bold text-g-ink">🔔 Daily reminders</p>
          <p className="text-sm font-semibold text-g-ink-3">A gentle nudge to log each evening</p>
        </div>
        <button
          onClick={toggle}
          disabled={busy || !supported}
          aria-label="Toggle daily reminders"
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50",
            on ? "bg-candy" : "bg-g-border-2"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
              on ? "left-[1.4rem]" : "left-0.5"
            )}
          />
        </button>
      </div>
      {!supported && (
        <p className="mt-2 rounded-2xl bg-g-lavender-soft px-3 py-2 text-xs font-bold text-g-ink">
          Add MyPMOS to your home screen first, then reminders can turn on.
        </p>
      )}
      {msg && <p className="mt-2 text-xs font-semibold text-g-ink-2">{msg}</p>}
    </section>
  )
}
