"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { useAuth } from "@/lib/auth"
import { getAllEntriesAsync } from "@/lib/tracker-store"
import {
  CHIP_GROUPS,
  FLOW_OPTIONS,
  ENERGY_OPTIONS,
  entryFilledCount,
  getStreak,
  toDateKey,
  type TrackEntry,
} from "@/lib/tracker"

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Hey there"
  return "Good evening"
}

export default function TodayPage() {
  const { user } = useAuth()
  const [entry, setEntry] = useState<TrackEntry | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    let active = true
    getAllEntriesAsync().then((all) => {
      if (!active) return
      const tk = toDateKey(new Date())
      setEntry(all.find((e) => e.date === tk) ?? { date: tk })
      setStreak(getStreak(all))
    })
    return () => {
      active = false
    }
  }, [user])

  const filled = entry ? entryFilledCount(entry) : 0
  const flowLabel = entry?.flow ? FLOW_OPTIONS.find((f) => f.id === entry.flow) : undefined
  const energyLabel = entry?.energy ? ENERGY_OPTIONS.find((e) => e.id === entry.energy) : undefined

  // A friendly list of what's been logged today, for the summary card.
  const loggedTags: string[] = []
  if (entry) {
    if (flowLabel) loggedTags.push(`${flowLabel.emoji} ${flowLabel.label}`)
    if (energyLabel) loggedTags.push(`${energyLabel.emoji} ${energyLabel.label}`)
    for (const g of CHIP_GROUPS) {
      const v = entry[g.key] as string[] | undefined
      if (v && v.length) {
        const opt = g.options.find((o) => o.id === v[0])
        if (opt) loggedTags.push(`${opt.emoji} ${opt.label}${v.length > 1 ? ` +${v.length - 1}` : ""}`)
      }
    }
  }

  return (
    <PatientShell>
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-bold text-g-ink-3">{greeting()} 🌷</p>
          <h1 className="font-cute text-3xl font-bold text-g-ink">How are you feeling?</h1>
        </div>
        <div className="flex flex-col items-center rounded-3xl bg-white px-4 py-2 shadow-girly">
          <span className="text-2xl leading-none">🔥</span>
          <span className="text-lg font-extrabold leading-none text-g-pink-deep">{streak}</span>
          <span className="text-[0.6rem] font-bold text-g-ink-3">day streak</span>
        </div>
      </div>

      {/* Big log CTA */}
      <Link
        href="/track"
        className="mt-5 block overflow-hidden rounded-[2rem] bg-candy p-5 shadow-girly-pop transition active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-cute text-xl font-bold text-white">
              {filled === 0 ? "Log today 💕" : "Add to today ✨"}
            </p>
            <p className="text-sm font-semibold text-white/90">
              {filled === 0
                ? "Tap to track how you feel right now"
                : `${filled} things logged so far — keep going!`}
            </p>
          </div>
          <span className="animate-float text-4xl">🌸</span>
        </div>
      </Link>

      {/* Today summary */}
      {loggedTags.length > 0 && (
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <h2 className="mb-2 font-cute text-base font-bold text-g-ink">Today so far</h2>
          <div className="flex flex-wrap gap-2">
            {loggedTags.map((t, i) => (
              <span key={i} className="rounded-full bg-candy-soft px-3 py-1.5 text-sm font-bold text-g-ink">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Quick links to the rest of the app */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <FeatureCard href="/insights" emoji="✨" title="Insights" sub="Your patterns" tint="bg-g-lavender-soft" />
        <FeatureCard href="/community" emoji="💬" title="Community" sub="Ask the girls" tint="bg-g-pink-soft" />
        <FeatureCard href="/learn" emoji="📚" title="Learn" sub="Real research" tint="bg-g-mint-soft" />
        <FeatureCard href="/export" emoji="📄" title="Gyno PDF" sub="Visit-ready" tint="bg-g-peach-soft" />
      </div>

      <p className="mt-6 px-2 text-center text-xs font-semibold text-g-ink-3">
        Polaris is your companion, not a doctor. We never diagnose. For medical
        concerns, please see a healthcare provider. 💗
      </p>
    </PatientShell>
  )
}

function FeatureCard({
  href,
  emoji,
  title,
  sub,
  tint,
}: {
  href: string
  emoji: string
  title: string
  sub: string
  tint: string
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-g-border bg-white p-4 shadow-girly transition active:scale-[0.97]"
    >
      <span className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${tint}`}>{emoji}</span>
      <p className="mt-3 font-cute text-base font-bold text-g-ink">{title}</p>
      <p className="text-sm font-semibold text-g-ink-3">{sub}</p>
    </Link>
  )
}
