"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Pin, PinOff, Eye, EyeOff, ChevronUp, ChevronDown, Lock } from "lucide-react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import { GOALS, getProfile, hydrateProfileFromMetadata, saveProfile, type CycleProfile, type Goal } from "@/lib/profile"
import {
  LOG_SECTIONS,
  resolveLogLayout,
  sectionMeta,
  profileGoals,
  togglePinned,
  toggleHidden,
  reorder,
  type SectionId,
  type TrackPrefs,
} from "@/lib/tracking-prefs"
import { ACCENT } from "@/lib/tracker"

export default function CustomizeTrackingPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CycleProfile>({})

  const refresh = useCallback(() => setProfile(getProfile()), [])

  useEffect(() => {
    if (user?.user_metadata?.cycle) hydrateProfileFromMetadata(user.user_metadata.cycle)
    refresh()
  }, [user, refresh])

  const prefs: TrackPrefs = (profile.trackPrefs ?? {}) as TrackPrefs
  const goals = profileGoals(profile)
  const { featured, more } = resolveLogLayout(profile)
  const hidden = LOG_SECTIONS.map((s) => s.id).filter((id) => (prefs.hidden ?? []).includes(id) && !sectionMeta(id).core)

  function commit(nextPrefs: TrackPrefs) {
    saveProfile({ ...getProfile(), trackPrefs: nextPrefs })
    refresh()
  }
  function toggleGoal(id: Goal) {
    const cur = profileGoals(getProfile())
    const next = cur.includes(id) ? cur.filter((g) => g !== id) : cur.length >= 3 ? cur : [...cur, id]
    if (next.length === 0) return // always keep at least one focus
    saveProfile({ ...getProfile(), goals: next, goal: next[0] })
    refresh()
  }

  // One ordered list: what leads, then more, then hidden at the bottom.
  const rows: { id: SectionId; state: "featured" | "more" | "hidden" }[] = [
    ...featured.map((id) => ({ id, state: "featured" as const })),
    ...more.map((id) => ({ id, state: "more" as const })),
    ...hidden.map((id) => ({ id, state: "hidden" as const })),
  ]

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <Link href="/track" className="grid h-9 w-9 place-items-center rounded-full bg-white text-g-ink-2 shadow-girly active:scale-90" aria-label="Back to Track">
          <ArrowLeft size={17} />
        </Link>
        <div>
          <h1 className="font-cute text-2xl text-g-ink">What I track</h1>
          <p className="text-sm font-medium text-g-ink-3">Make it yours. Nothing is ever deleted.</p>
        </div>
      </div>

      {/* Goals — what leads the whole app */}
      <section className="mt-5 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
        <h2 className="font-cute text-base font-bold text-g-ink">My focus</h2>
        <p className="mt-0.5 text-xs font-semibold text-g-ink-3">Pick up to 3. These bring the right trackers to the top.</p>
        <div className="mt-3 space-y-2">
          {GOALS.map((g) => {
            const sel = goals.includes(g.id)
            return (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                  sel ? "border-transparent bg-candy text-white shadow-girly" : "border-g-border bg-white"
                )}
              >
                <span className="text-xl">{g.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{g.label}</span>
                  <span className={cn("text-xs font-semibold", sel ? "text-white/90" : "text-g-ink-3")}>{g.blurb}</span>
                </span>
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", sel ? "border-white bg-white/20" : "border-g-border-2")}>
                  {sel && <span className="text-sm font-black text-white">✓</span>}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Sections — pin, hide, reorder */}
      <section className="mt-5">
        <h2 className="px-1 font-cute text-base font-bold text-g-ink">My trackers</h2>
        <p className="mt-0.5 px-1 text-xs font-semibold text-g-ink-3">
          Pin to keep it up top, hide to tuck it away, or reorder. Hidden trackers stay in your history and can come back anytime.
        </p>
        <div className="mt-3 space-y-2">
          {rows.map(({ id, state }, i) => {
            const m = sectionMeta(id)
            const isPinned = (prefs.pinned ?? []).includes(id)
            return (
              <div key={id} className="flex items-center gap-2.5 rounded-2xl border border-g-border bg-white px-3 py-2.5 shadow-girly">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-base", ACCENT[m.accent].soft)}>{m.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-g-ink">{m.title}</span>
                    <StatePill state={state} pinned={isPinned} core={m.core} />
                  </span>
                  <span className="block truncate text-xs font-medium text-g-ink-3">{m.desc}</span>
                </span>

                {/* reorder */}
                <div className="flex shrink-0 flex-col">
                  <button onClick={() => commit(reorder(prefs, id, -1))} disabled={i === 0} className="text-g-ink-3 disabled:opacity-25 active:scale-90" aria-label="Move up">
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => commit(reorder(prefs, id, 1))} disabled={i === rows.length - 1} className="text-g-ink-3 disabled:opacity-25 active:scale-90" aria-label="Move down">
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* pin */}
                <button
                  onClick={() => commit(togglePinned(prefs, id))}
                  className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full active:scale-90", isPinned ? "bg-g-pink text-white" : "bg-g-canvas text-g-ink-3")}
                  aria-label={isPinned ? "Unpin" : "Pin"}
                >
                  {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                </button>

                {/* hide (core can't be hidden) */}
                {m.core ? (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-g-canvas text-g-ink-3" aria-label="Always on">
                    <Lock size={14} />
                  </span>
                ) : (
                  <button
                    onClick={() => commit(toggleHidden(prefs, id))}
                    className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full active:scale-90", state === "hidden" ? "bg-g-ink text-white" : "bg-g-canvas text-g-ink-3")}
                    aria-label={state === "hidden" ? "Show" : "Hide"}
                  >
                    {state === "hidden" ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Link
        href="/track"
        className="mt-6 flex items-center justify-center rounded-full bg-candy py-3.5 font-cute text-base font-bold text-white shadow-girly-pop active:scale-[0.98]"
      >
        Done 💕
      </Link>
      <p className="mt-4 px-2 text-center text-xs font-semibold text-g-ink-3">
        Everything you log flows into one Insights, no matter how you arrange it. 💗
      </p>
    </PatientShell>
  )
}

function StatePill({ state, pinned, core }: { state: "featured" | "more" | "hidden"; pinned: boolean; core?: boolean }) {
  if (core) return <Tag className="bg-g-pink-soft text-g-pink-deep">Always on</Tag>
  if (pinned) return <Tag className="bg-g-pink text-white">Pinned</Tag>
  if (state === "featured") return <Tag className="bg-g-lavender-soft text-g-lavender">Leading</Tag>
  if (state === "hidden") return <Tag className="bg-g-canvas text-g-ink-3">Hidden</Tag>
  return <Tag className="bg-g-canvas text-g-ink-3">More</Tag>
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide", className)}>{children}</span>
}
