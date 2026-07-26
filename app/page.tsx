"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { GirlyLogo, PatientShell } from "@/components/patient-shell"
import { useAuth } from "@/lib/auth"
import { getAllEntriesAsync } from "@/lib/tracker-store"
import { getResult } from "@/lib/assessments"
import { getLabs } from "@/lib/labs"
import { getGoals } from "@/lib/goals"
import { getHistory } from "@/lib/history"
import { Flame } from "lucide-react"
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
  GOALS,
  getProfile,
  hasOnboarded,
  hydrateProfileFromMetadata,
  type CycleProfile,
  type Goal,
} from "@/lib/profile"
import { profileGoals } from "@/lib/tracking-prefs"
import {
  PHASE_META,
  canPredictCycle,
  computeCycle,
  cycleHistory,
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

/** "For you" nudges: what's worth logging next, from what you've captured so far. */
function SmartPrompts({ filledToday, onPeriod }: { filledToday: number; onPeriod: boolean }) {
  const [prompts, setPrompts] = useState<{ emoji: string; text: string; href: string }[]>([])
  useEffect(() => {
    const out: { emoji: string; text: string; href: string }[] = []
    if (onPeriod) out.push({ emoji: "🩸", text: "You're on your period — log today's flow", href: "/track" })
    if (filledToday === 0 && !onPeriod) out.push({ emoji: "📝", text: "Log how you're feeling today", href: "/track" })
    const h = getHistory()
    if (!h.mainConcern) out.push({ emoji: "🎯", text: "Tell us your main concern", href: "/history" })
    if (getGoals().length === 0) out.push({ emoji: "✨", text: "Set your top 2 goals", href: "/goals" })
    const fg = getResult("fg")
    if (!fg || Date.now() - fg.updatedAt > 21 * 86_400_000)
      out.push({ emoji: "🪶", text: fg ? "Update your hair self-score" : "Try the hair self-score", href: "/assessments" })
    if (getLabs().length === 0) out.push({ emoji: "🧪", text: "Add your latest labs", href: "/labs" })
    if (h.contraception.length === 0) out.push({ emoji: "💊", text: "Add your birth control history", href: "/history" })
    setPrompts(out.slice(0, 3))
  }, [filledToday, onPeriod])

  if (prompts.length === 0) return null
  return (
    <section className="mt-5">
      <p className="px-1 text-xs font-bold uppercase tracking-wide text-g-ink-3">For you</p>
      <div className="mt-1.5 space-y-2">
        {prompts.map((p, i) => (
          <Link
            key={i}
            href={p.href}
            className="flex items-center gap-3 rounded-3xl border border-g-border bg-white px-4 py-3 shadow-girly active:scale-[0.99]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-candy-soft text-lg">{p.emoji}</span>
            <span className="flex-1 text-sm font-bold text-g-ink">{p.text}</span>
            <span className="text-g-ink-3">›</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function TodayPage() {
  const { user } = useAuth()
  const [entry, setEntry] = useState<TrackEntry | null>(null)
  const [streak, setStreak] = useState(0)
  const [profile, setProfile] = useState<CycleProfile>({})
  const [cycle, setCycle] = useState<CycleStatus | null>(null)
  const [canPredict, setCanPredict] = useState(false)

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
      // Anchor predictions to the most recent real logged period, and use the
      // cycle length learned from the user's own history when we have it.
      const loggedStart = deriveLastPeriodStart(all)
      const hist = cycleHistory(all)
      setCycle(computeCycle(prof, loggedStart, tk, hist.average, false))
      setCanPredict(canPredictCycle(hist, prof))
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
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-g-ink-3">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="font-cute text-[1.85rem] leading-tight text-g-ink">
            {greeting()}
            {profile.name ? `, ${profile.name}` : ""}
            <span className="text-g-pink">.</span>
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-g-border bg-white px-3.5 py-3 shadow-girly">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-g-peach-soft">
            <Flame size={16} className="text-g-peach" />
          </span>
          <div className="leading-none">
            <p className="text-[11px] font-semibold text-g-ink-3">Streak</p>
            <p className="mt-0.5 text-lg font-bold leading-none text-g-ink">{streak}</p>
          </div>
        </div>
      </div>

      {/* Personalized cycle card — or an invite to personalize */}
      {onboarded ? (
        cycle &&
        (canPredict ? (
          <CycleCard cycle={cycle} profile={profile} onPeriodLogged={!!(entry?.flow && entry.flow !== "none")} />
        ) : (
          <LearningCard anchorDate={cycle.anchorDate} />
        ))
      ) : (
        <Link
          href="/onboarding"
          className="mt-6 block overflow-hidden rounded-[2.5rem] bg-candy p-8 text-center shadow-girly-pop ring-4 ring-white/40 transition active:scale-[0.98]"
        >
          <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white/15">
            <GirlyLogo size={64} withWordmark={false} tone="white" />
          </span>
          <p className="mt-4 font-cute text-4xl font-bold leading-tight text-white">Personalize MyPMOS</p>
          <p className="mx-auto mt-2.5 max-w-xs text-base font-semibold text-white/90">
            Tell us about your cycle to unlock daily, tailored guidance.
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-base font-bold text-g-pink-deep">
            Get started →
          </span>
        </Link>
      )}

      {onboarded && (
        <FocusSection
          profile={profile}
          cycle={cycle}
          filled={filled}
          onPeriod={!!(entry?.flow && entry.flow !== "none")}
        />
      )}

      <SmartPrompts filledToday={filled} onPeriod={!!(entry?.flow && entry.flow !== "none")} />

      {/* Big log CTA */}
      <Link
        href="/track"
        className="mt-5 block overflow-hidden rounded-[2rem] bg-candy p-5 shadow-girly-pop transition active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-cute text-xl font-bold text-white">
              {filled === 0 ? "Log today" : "Add to today"}
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
        <FeatureCard href="/community" emoji="💬" title="Community" sub="Connect & ask" tint="bg-g-pink-soft" />
        <FeatureCard href="/learn" emoji="📚" title="Learn" sub="Real research" tint="bg-g-mint-soft" />
        <FeatureCard href="/export" emoji="📄" title="Gyno PDF" sub="Visit-ready" tint="bg-g-peach-soft" />
      </div>

      <p className="mt-6 px-2 text-center text-xs font-semibold text-g-ink-3">
        MyPMOS is your companion, not a doctor. We never diagnose. For medical
        concerns, please see a healthcare provider. 💗
      </p>
    </PatientShell>
  )
}

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * "Your focus" — the home screen leads with the goals she chose, so her
 * priorities are front and center. Each card points to the most useful next
 * action for that goal, with a line of live context where we have it. Cards are
 * capped at her (max 3) goals, so this never crowds the page.
 */
function FocusSection({
  profile,
  cycle,
  filled,
  onPeriod,
}: {
  profile: CycleProfile
  cycle: CycleStatus | null
  filled: number
  onPeriod: boolean
}) {
  const goals = profileGoals(profile)
  if (goals.length === 0) return null

  const meta = (id: Goal) => GOALS.find((g) => g.id === id)
  const TINT: Record<Goal, string> = {
    regulate: "bg-g-pink-soft",
    symptoms: "bg-g-peach-soft",
    ttc: "bg-g-lavender-soft",
    understand: "bg-g-mint-soft",
    weight: "bg-g-butter-soft",
  }

  function cardFor(id: Goal): { sub: string; href: string; cta: string } {
    switch (id) {
      case "regulate":
        return {
          sub: onPeriod
            ? "On your period — logging it teaches MyPMOS your rhythm."
            : "Log every period so MyPMOS learns your real rhythm.",
          href: "/period",
          cta: "Open period tracker",
        }
      case "symptoms":
        return {
          sub: filled > 0 ? "Symptoms logged today — nice work." : "Log today's symptoms to catch what sets them off.",
          href: "/track",
          cta: "Log symptoms",
        }
      case "ttc":
        return {
          sub:
            cycle && cycle.fertileWindow && !cycle.isLate
              ? "You may be in your fertile window right now."
              : "Track discharge and basal temp to spot ovulation.",
          href: "/track",
          cta: "Log fertility signs",
        }
      case "understand":
        return { sub: "See the patterns forming across your logs.", href: "/insights", cta: "Open Insights" }
      case "weight":
        return { sub: "Log movement, energy and cravings for the full picture.", href: "/track", cta: "Log today" }
      default:
        return { sub: "", href: "/track", cta: "Open" }
    }
  }

  return (
    <section className="mt-5">
      <p className="px-1 text-xs font-bold uppercase tracking-wide text-g-ink-3">Your focus</p>
      <div className="mt-1.5 space-y-2">
        {goals.map((id) => {
          const m = meta(id)
          const c = cardFor(id)
          if (!m) return null
          return (
            <Link
              key={id}
              href={c.href}
              className="flex items-center gap-3 rounded-3xl border border-g-border bg-white px-4 py-3.5 shadow-girly active:scale-[0.99]"
            >
              <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl", TINT[id])}>{m.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-cute text-base font-bold text-g-ink">{m.label}</span>
                <span className="block text-xs font-semibold text-g-ink-3">{c.sub}</span>
              </span>
              <span className="shrink-0 text-g-ink-3">›</span>
            </Link>
          )
        })}
      </div>
      <Link href="/track/customize" className="mt-2 block px-1 text-right text-xs font-bold text-g-pink-deep active:scale-95">
        Edit my focus ›
      </Link>
    </section>
  )
}

/** Shown until we have enough logged cycles to predict — no guessing for irregular cycles. */
function LearningCard({ anchorDate }: { anchorDate: string | null }) {
  const daysAgo = anchorDate
    ? Math.max(0, Math.round((Date.now() - new Date(anchorDate + "T00:00:00").getTime()) / 86_400_000))
    : null
  return (
    <section className="mt-5 rounded-[2rem] border border-g-border bg-white p-5 shadow-girly">
      <p className="font-cute text-lg text-g-ink">🌙 Learning your cycle</p>
      {anchorDate ? (
        <p className="mt-1 text-sm font-semibold text-g-ink-3">
          Last period: {fmtDate(anchorDate)}
          {daysAgo != null ? ` · ${daysAgo} days ago` : ""}
        </p>
      ) : (
        <p className="mt-1 text-sm font-semibold text-g-ink-3">Log your periods to get started.</p>
      )}
      <p className="mt-2 text-sm font-medium text-g-ink-2">
        PMOS cycles are often irregular, so MyPMOS won&apos;t guess your next period yet. Once you&apos;ve logged a
        couple of cycles, your predictions and phase will appear here.
      </p>
      <Link
        href="/period"
        className="mt-3 flex items-center justify-between rounded-2xl bg-g-pink-soft px-4 py-2.5 text-sm font-bold text-g-pink-deep active:scale-[0.99]"
      >
        <span>🩸 Log or update my period</span>
        <span>›</span>
      </Link>
    </section>
  )
}

function CycleCard({ cycle, profile, onPeriodLogged }: { cycle: CycleStatus; profile: CycleProfile; onPeriodLogged: boolean }) {
  const meta = PHASE_META[cycle.phase]
  // Only say "Period" if she actually logged flow; otherwise it's an estimate.
  const phaseLabel = cycle.phase === "menstrual" && !onPeriodLogged ? "Period expected" : meta.label

  // Onboarded but no period date yet → invite them to add it.
  if (cycle.cycleDay === null) {
    return (
      <Link
        href="/period"
        className="mt-5 block rounded-[2rem] border border-g-border bg-white p-5 shadow-girly transition active:scale-[0.99]"
      >
        <p className="font-cute text-lg text-g-ink">🌸 Add your last period</p>
        <p className="mt-1 text-sm font-semibold text-g-ink-3">
          Tell the tracker when your last period started and MyPMOS will show your cycle day + what to expect.
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
          <p className="font-cute text-xl leading-tight text-g-ink">
            Day {cycle.cycleDay} · {phaseLabel}
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

      <Link
        href="/period"
        className="mt-3 flex items-center justify-between rounded-2xl bg-g-pink-soft px-4 py-2.5 text-sm font-bold text-g-pink-deep active:scale-[0.99]"
      >
        <span>🩸 Log or update my period</span>
        <span>›</span>
      </Link>

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
