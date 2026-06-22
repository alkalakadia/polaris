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
import {
  getProfile,
  hasOnboarded,
  hydrateProfileFromMetadata,
  type CycleProfile,
} from "@/lib/profile"
import {
  PHASE_META,
  computeCycle,
  deriveLastPeriodStart,
  phaseTip,
  type CycleStatus,
} from "@/lib/cycle"
import { cn } from "@/lib/cn"

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
  const [profile, setProfile] = useState<CycleProfile>({})
  const [cycle, setCycle] = useState<CycleStatus | null>(null)

  useEffect(() => {
    let active = true
    // Pull a cloud-synced profile down after sign-in, then read it.
    if (user?.user_metadata?.cycle) hydrateProfileFromMetadata(user.user_metadata.cycle)
    const prof = getProfile()
    if (active) setProfile(prof)

    getAllEntriesAsync().then((all) => {
      if (!active) return
      const tk = toDateKey(new Date())
      setEntry(all.find((e) => e.date === tk) ?? { date: tk })
      setStreak(getStreak(all))
      // Anchor predictions to the most recent real logged period when available.
      const loggedStart = deriveLastPeriodStart(all)
      setCycle(computeCycle(prof, loggedStart, tk))
    })
    return () => {
      active = false
    }
  }, [user])

  const onboarded = hasOnboarded(profile)

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
          <p className="text-sm font-bold text-g-ink-3">
            {greeting()}{profile.name ? `, ${profile.name}` : ""} 🌷
          </p>
          <h1 className="font-cute text-3xl font-bold text-g-ink">How are you feeling?</h1>
        </div>
        <div className="flex flex-col items-center rounded-3xl bg-white px-4 py-2 shadow-girly">
          <span className="text-2xl leading-none">🔥</span>
          <span className="text-lg font-extrabold leading-none text-g-pink-deep">{streak}</span>
          <span className="text-[0.6rem] font-bold text-g-ink-3">day streak</span>
        </div>
      </div>

      {/* Personalized cycle card — or an invite to personalize */}
      {onboarded ? (
        cycle && <CycleCard cycle={cycle} profile={profile} />
      ) : (
        <Link
          href="/onboarding"
          className="mt-5 block overflow-hidden rounded-[2rem] bg-candy p-5 shadow-girly-pop transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="pr-3">
              <p className="font-cute text-xl font-bold text-white">Personalize Polaris ✨</p>
              <p className="text-sm font-semibold text-white/90">
                Tell us about your cycle to unlock daily, tailored guidance.
              </p>
            </div>
            <span className="animate-float text-4xl">🌸</span>
          </div>
        </Link>
      )}

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

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function CycleCard({ cycle, profile }: { cycle: CycleStatus; profile: CycleProfile }) {
  const meta = PHASE_META[cycle.phase]

  // Onboarded but no period date yet → invite them to add it.
  if (cycle.cycleDay === null) {
    return (
      <Link
        href="/onboarding"
        className="mt-5 block rounded-[2rem] border border-g-border bg-white p-5 shadow-girly transition active:scale-[0.99]"
      >
        <p className="font-cute text-lg font-bold text-g-ink">🌸 Add your last period</p>
        <p className="mt-1 text-sm font-semibold text-g-ink-3">
          Pop in when your last period started and Polaris will show your cycle day + what to expect.
        </p>
      </Link>
    )
  }

  const pct = Math.min(100, Math.round((cycle.cycleDay / cycle.cycleLength) * 100))
  const nextLine = cycle.isLate
    ? `Period was expected ~${cycle.daysLate} day${cycle.daysLate === 1 ? "" : "s"} ago`
    : `Period in ~${cycle.nextPeriodInDays} day${cycle.nextPeriodInDays === 1 ? "" : "s"}${
        cycle.nextPeriodDate ? ` · around ${fmtDate(cycle.nextPeriodDate)}` : ""
      }`

  return (
    <section className="mt-5 rounded-[2rem] border border-g-border bg-white p-5 shadow-girly">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl", meta.tint)}>
          {meta.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-cute text-xl font-bold leading-tight text-g-ink">
            Day {cycle.cycleDay} · {meta.label}
          </p>
          <p className="text-sm font-semibold text-g-ink-3">{nextLine}</p>
        </div>
        {cycle.fertileWindow && !cycle.isLate && (
          <span className="shrink-0 rounded-full bg-g-peach-soft px-2.5 py-1 text-xs font-bold text-g-ink">
            ✨ Fertile
          </span>
        )}
      </div>

      {/* cycle progress */}
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-g-canvas-2">
        <div className="h-full rounded-full bg-candy" style={{ width: `${pct}%` }} />
      </div>

      <p className="mt-3 text-sm font-medium text-g-ink-2">{phaseTip(cycle.phase, profile.goal)}</p>

      <p className="mt-3 text-[0.7rem] font-semibold text-g-ink-3">
        Estimate from your average{cycle.irregular ? ", and your cycles vary so it's a rough guide" : ""}.
        Not medical advice. 💗
      </p>
    </section>
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
