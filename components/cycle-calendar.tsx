"use client"

import { useState } from "react"
import { cn } from "@/lib/cn"
import {
  CHIP_GROUPS,
  FLOW_OPTIONS,
  entryFilledCount,
  toDateKey,
  type TrackEntry,
} from "@/lib/tracker"
import { computeCycle } from "@/lib/cycle"
import type { CycleProfile } from "@/lib/profile"

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

/**
 * Scrollable month calendar: real logged period days (solid), predicted period
 * (outline), predicted fertile window (peach), and any logged day (dot). Tap a
 * day to see what was logged. This is the "history that compounds" surface.
 */
export function CycleCalendar({
  entries,
  profile,
  anchor,
}: {
  entries: TrackEntry[]
  profile: CycleProfile
  anchor: string | null
}) {
  const [offset, setOffset] = useState(0) // months from current
  const [selected, setSelected] = useState<string | null>(null)

  const byDate = new Map(entries.map((e) => [e.date, e]))
  const now = new Date()
  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toDateKey(now)
  const onboarded = Boolean(profile.completedAt)
  const periodLen = profile.periodLength || 5

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  function info(date: Date) {
    const key = toDateKey(date)
    const e = byDate.get(key)
    const realPeriod = Boolean(e?.flow && e.flow !== "none")
    const logged = e ? entryFilledCount(e) > 0 : false
    const isFuture = key > todayKey
    let predictedPeriod = false
    let fertile = false
    if (onboarded && anchor && isFuture) {
      const cs = computeCycle(profile, anchor, key)
      if (cs.cycleDay !== null) {
        if (cs.cycleDay <= periodLen) predictedPeriod = true
        if (cs.fertileWindow) fertile = true
      }
    }
    return { key, e, realPeriod, predictedPeriod, fertile, logged, isToday: key === todayKey }
  }

  const selEntry = selected ? byDate.get(selected) : undefined

  return (
    <section className="rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setOffset(offset - 1)}
          className="grid h-8 w-8 place-items-center rounded-full bg-g-canvas text-g-ink-2 active:scale-90"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="font-cute text-base font-bold text-g-ink">
          {view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={() => setOffset(Math.min(2, offset + 1))}
          disabled={offset >= 2}
          className="grid h-8 w-8 place-items-center rounded-full bg-g-canvas text-g-ink-2 active:scale-90 disabled:opacity-30"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-[0.65rem] font-bold text-g-ink-3">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const d = info(date)
          const isSel = selected === d.key
          return (
            <button
              key={i}
              onClick={() => setSelected(isSel ? null : d.key)}
              className={cn(
                "relative mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition active:scale-90",
                d.realPeriod
                  ? "bg-g-pink text-white"
                  : d.predictedPeriod
                    ? "border-2 border-dashed border-g-pink text-g-pink-deep"
                    : d.fertile
                      ? "bg-g-peach-soft text-g-ink"
                      : "text-g-ink-2",
                d.isToday && !d.realPeriod && "ring-2 ring-g-ink ring-offset-1",
                isSel && "ring-2 ring-g-lavender ring-offset-1"
              )}
            >
              {date.getDate()}
              {d.logged && !d.realPeriod && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-g-lavender" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] font-bold text-g-ink-3">
        <Legend className="bg-g-pink" label="Period" />
        <Legend className="border-2 border-dashed border-g-pink" label="Predicted" />
        <Legend className="bg-g-peach-soft" label="Fertile" />
        <Legend className="bg-g-lavender" label="Logged" dot />
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="mt-3 rounded-2xl bg-g-canvas px-4 py-3">
          <p className="font-cute text-sm font-bold text-g-ink">
            {new Date(selected + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          {selEntry && entryFilledCount(selEntry) > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {selEntry.flow && selEntry.flow !== "none" && (
                <Tag>{FLOW_OPTIONS.find((f) => f.id === selEntry.flow)?.emoji} {FLOW_OPTIONS.find((f) => f.id === selEntry.flow)?.label}</Tag>
              )}
              {CHIP_GROUPS.flatMap((g) => {
                const v = selEntry[g.key] as string[] | undefined
                return (v ?? []).map((id) => {
                  const o = g.options.find((x) => x.id === id)
                  return o ? <Tag key={`${g.key}-${id}`}>{o.emoji} {o.label}</Tag> : null
                })
              })}
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-g-ink-3">Nothing logged this day.</p>
          )}
        </div>
      )}
    </section>
  )
}

function Legend({ className, label, dot }: { className: string; label: string; dot?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn(dot ? "h-1.5 w-1.5" : "h-3 w-3", "rounded-full", className)} />
      {label}
    </span>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-g-ink shadow-sm">{children}</span>
}
