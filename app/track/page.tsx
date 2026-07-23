"use client"

import Link from "next/link"
import { ClipboardList, CalendarDays, Camera, SlidersHorizontal, ChevronDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import { getEntryAsync, saveEntryAsync } from "@/lib/tracker-store"
import {
  ACCENT,
  CHIP_GROUPS,
  ENERGY_OPTIONS,
  FLOW_OPTIONS,
  OV_TEST_OPTIONS,
  SLEEP_QUALITY_OPTIONS,
  TRACKABLE_CATEGORIES,
  entryFilledCount,
  toDateKey,
  type ChipOption,
  type GirlyAccent,
  type TrackEntry,
} from "@/lib/tracker"
import { getProfile, hydrateProfileFromMetadata, type CycleProfile } from "@/lib/profile"
import { resolveLogLayout, sectionMeta, type SectionId } from "@/lib/tracking-prefs"

function prettyDate(key: string): { big: string; small: string; isToday: boolean } {
  const today = toDateKey(new Date())
  const d = new Date(key + "T00:00:00")
  const isToday = key === today
  const big = isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "long" })
  const small = d.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  return { big, small, isToday }
}

const CHIP_GROUP_BY_KEY = new Map(CHIP_GROUPS.map((g) => [g.key as string, g]))

/** Does this section have anything logged today? Drives the little "filled" dot. */
function sectionFilled(id: SectionId, e: TrackEntry): boolean {
  switch (id) {
    case "period":
      return !!e.flow && e.flow !== "none"
    case "energy":
      return !!e.energy
    case "sleep":
      return !!e.sleepQuality || !!e.sleepHours
    case "pain":
      return typeof e.pain === "number" && e.pain > 0
    case "water":
      return (e.water ?? 0) > 0
    case "measurements":
      return e.weightKg != null || e.bbt != null || e.bpSys != null || !!e.ovTest
    case "notes":
      return !!(e.notes && e.notes.trim())
    default: {
      const v = e[id as keyof TrackEntry]
      return Array.isArray(v) ? v.length > 0 : Boolean(v)
    }
  }
}

export default function TrackPage() {
  const { user } = useAuth()
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()))
  const [entry, setEntry] = useState<TrackEntry>({ date: dateKey })
  const [profile, setProfile] = useState<CycleProfile>({})
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  // Keep the personalization (goals + pins) fresh, including after editing it.
  useEffect(() => {
    if (user?.user_metadata?.cycle) hydrateProfileFromMetadata(user.user_metadata.cycle)
    setProfile(getProfile())
  }, [user])

  // Load the selected day's entry.
  useEffect(() => {
    let active = true
    setReady(false)
    getEntryAsync(dateKey).then((e) => {
      if (!active) return
      setEntry(e)
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [dateKey, user])

  function update(partial: Partial<TrackEntry>) {
    setEntry((prev) => {
      const next = { ...prev, ...partial, date: dateKey }
      void saveEntryAsync(next)
      return next
    })
    setSavedAt(Date.now())
  }

  function toggleMulti(key: keyof TrackEntry, id: string) {
    const current = (entry[key] as string[] | undefined) ?? []
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    update({ [key]: next } as Partial<TrackEntry>)
  }
  function toggleSingle(key: keyof TrackEntry, id: string) {
    const current = entry[key]
    update({ [key]: current === id ? undefined : id } as Partial<TrackEntry>)
  }
  function toggleSingleArray(key: keyof TrackEntry, id: string) {
    const current = (entry[key] as string[] | undefined) ?? []
    update({ [key]: current[0] === id ? [] : [id] } as Partial<TrackEntry>)
  }
  // Symptoms cycle through severity: off → mild → moderate → severe → off.
  function cycleSeverity(id: string) {
    const cur = entry.symptomSeverity?.[id] ?? 0
    const next = (cur + 1) % 4
    const sev: Record<string, 1 | 2 | 3> = { ...(entry.symptomSeverity ?? {}) }
    if (next === 0) delete sev[id]
    else sev[id] = next as 1 | 2 | 3
    update({ symptomSeverity: sev, symptoms: Object.keys(sev) })
  }

  const filled = useMemo(() => entryFilledCount(entry), [entry])
  const { big, small, isToday } = prettyDate(dateKey)
  const { featured, more } = useMemo(() => resolveLogLayout(profile), [profile])

  const units = profile.units ?? "us"
  const wUnit = units === "metric" ? "kg" : "lb"
  const tUnit = units === "metric" ? "°C" : "°F"
  const toKg = (v: number) => (units === "metric" ? v : v * 0.453592)
  const fromKg = (v: number) => (units === "metric" ? v : v / 0.453592)
  const toC = (v: number) => (units === "metric" ? v : ((v - 32) * 5) / 9)
  const fromC = (v: number) => (units === "metric" ? v : (v * 9) / 5 + 32)
  const r1 = (v: number) => Math.round(v * 10) / 10

  function shiftDay(delta: number) {
    const d = new Date(dateKey + "T00:00:00")
    d.setDate(d.getDate() + delta)
    if (toDateKey(d) > toDateKey(new Date())) return // no future logging
    setDateKey(toDateKey(d))
  }

  function renderChips(key: keyof TrackEntry, accent: GirlyAccent, multi: boolean) {
    const group = CHIP_GROUP_BY_KEY.get(key as string)
    if (!group) return null
    const selected = (entry[key] as string[] | undefined) ?? []
    return (
      <div className="flex flex-wrap gap-2">
        {group.options.map((o) => (
          <Chip
            key={o.id}
            option={o}
            accent={accent}
            selected={selected.includes(o.id)}
            onClick={() => (multi ? toggleMulti(key, o.id) : toggleSingleArray(key, o.id))}
          />
        ))}
      </div>
    )
  }

  /** Inner controls for a section — the same UI as before, just addressable by id. */
  function renderContent(id: SectionId): React.ReactNode {
    switch (id) {
      case "period": {
        const on = !!entry.flow && entry.flow !== "none"
        return on ? (
          <>
            <p className="mb-2.5 text-sm font-bold text-g-ink">You&apos;re on your period today 🩷 How&apos;s the flow?</p>
            <div className="flex flex-wrap gap-2">
              {FLOW_OPTIONS.filter((o) => o.id !== "none").map((o) => (
                <Chip key={o.id} option={o} accent="pink" selected={entry.flow === o.id} onClick={() => update({ flow: o.id as TrackEntry["flow"] })} />
              ))}
            </div>
            <button
              onClick={() => update({ flow: "none" })}
              className="mt-3 w-full rounded-full border border-g-border bg-white py-3 text-sm font-bold text-g-ink-2 active:scale-[0.98]"
            >
              End period
            </button>
          </>
        ) : (
          <div>
            <p className="mb-3 text-sm font-semibold text-g-ink-3">Not on your period today 🌷</p>
            <button
              onClick={() => update({ flow: "medium" })}
              className="rounded-full bg-candy px-5 py-3 font-cute text-base font-bold text-white shadow-girly-pop active:scale-95"
            >
              🩸 Start my period
            </button>
          </div>
        )
      }
      case "energy":
        return (
          <div className="flex flex-wrap gap-2">
            {ENERGY_OPTIONS.map((o) => (
              <Chip key={o.id} option={o} accent="butter" selected={entry.energy === o.id} onClick={() => toggleSingle("energy", o.id)} />
            ))}
          </div>
        )
      case "sleep":
        return (
          <div className="flex flex-wrap items-center gap-2">
            {SLEEP_QUALITY_OPTIONS.map((o) => (
              <Chip key={o.id} option={o} accent="lavender" selected={entry.sleepQuality === o.id} onClick={() => toggleSingle("sleepQuality", o.id)} />
            ))}
            <div className="ml-auto flex items-center gap-2 rounded-full bg-g-lavender-soft px-3 py-1.5">
              <span className="text-sm font-bold text-g-ink">{entry.sleepHours ?? 0}h</span>
              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={entry.sleepHours ?? 0}
                onChange={(e) => update({ sleepHours: Number(e.target.value) })}
                className="w-24 accent-[var(--g-lavender)]"
                aria-label="Hours of sleep"
              />
            </div>
          </div>
        )
      case "pain":
        return (
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {(entry.pain ?? 0) === 0 ? "😌" : (entry.pain ?? 0) <= 3 ? "🙂" : (entry.pain ?? 0) <= 6 ? "😣" : "😭"}
            </span>
            <input
              type="range"
              min={0}
              max={10}
              value={entry.pain ?? 0}
              onChange={(e) => update({ pain: Number(e.target.value) })}
              className="flex-1 accent-[var(--g-pink)]"
              aria-label="Pain level 0 to 10"
            />
            <span className="w-10 text-right text-sm font-bold text-g-ink">{entry.pain ?? 0}/10</span>
          </div>
        )
      case "symptoms": {
        const sev = entry.symptomSeverity ?? {}
        const group = CHIP_GROUP_BY_KEY.get("symptoms")!
        return (
          <>
            <p className="mb-2.5 text-xs font-semibold text-g-ink-3">Tap to set how strong: mild → moderate → severe</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((o) => {
                const level: number = sev[o.id] ?? 0
                return (
                  <button
                    key={o.id}
                    onClick={() => cycleSeverity(o.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
                      level === 0
                        ? "border-g-border bg-g-canvas text-g-ink-2"
                        : level === 1
                          ? "border-transparent bg-g-pink-soft text-g-pink-deep"
                          : level === 2
                            ? "border-transparent bg-g-pink text-white"
                            : "border-transparent bg-g-pink-deep text-white"
                    )}
                  >
                    <span>{o.emoji}</span>
                    <span>{o.label}</span>
                    {level > 0 && <span className="ml-0.5 text-[0.6rem] font-extrabold tracking-tight">{"●".repeat(level)}</span>}
                  </button>
                )
              })}
            </div>
          </>
        )
      }
      case "moods":
        return renderChips("moods", "lavender", true)
      case "skinHair":
        return renderChips("skinHair", "peach", true)
      case "discharge":
        return renderChips("discharge", "sky", false)
      case "cravings":
        return renderChips("cravings", "butter", true)
      case "digestion":
        return renderChips("digestion", "mint", true)
      case "movement":
        return renderChips("movement", "sky", true)
      case "meds":
        return renderChips("meds", "lavender", true)
      case "water":
        return (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const on = (entry.water ?? 0) > i
              return (
                <button
                  key={i}
                  onClick={() => update({ water: on && (entry.water ?? 0) === i + 1 ? i : i + 1 })}
                  className={cn("text-2xl transition active:scale-90", on ? "opacity-100" : "opacity-30 grayscale")}
                  aria-label={`${i + 1} glasses of water`}
                >
                  🥤
                </button>
              )
            })}
          </div>
        )
      case "measurements":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label={`Weight (${wUnit})`}
                value={entry.weightKg != null ? r1(fromKg(entry.weightKg)) : ""}
                onChange={(v) => update({ weightKg: v === "" ? undefined : toKg(Number(v)) })}
              />
              <NumField
                label={`Basal temp (${tUnit})`}
                step="0.1"
                value={entry.bbt != null ? r1(fromC(entry.bbt)) : ""}
                onChange={(v) => update({ bbt: v === "" ? undefined : toC(Number(v)) })}
              />
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-bold text-g-ink-3">Blood pressure (mmHg)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="120"
                  value={entry.bpSys ?? ""}
                  onChange={(e) => update({ bpSys: e.target.value === "" ? undefined : Number(e.target.value) })}
                  className="w-20 rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 text-sm font-bold text-g-ink outline-none focus:border-g-pink"
                />
                <span className="font-bold text-g-ink-3">/</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="80"
                  value={entry.bpDia ?? ""}
                  onChange={(e) => update({ bpDia: e.target.value === "" ? undefined : Number(e.target.value) })}
                  className="w-20 rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 text-sm font-bold text-g-ink outline-none focus:border-g-pink"
                />
              </div>
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-bold text-g-ink-3">Ovulation test</p>
              <div className="flex flex-wrap gap-2">
                {OV_TEST_OPTIONS.map((o) => (
                  <Chip
                    key={o.id}
                    option={o}
                    accent="sky"
                    selected={entry.ovTest === o.id}
                    onClick={() => update({ ovTest: entry.ovTest === o.id ? undefined : (o.id as TrackEntry["ovTest"]) })}
                  />
                ))}
              </div>
            </div>
          </>
        )
      case "notes":
        return (
          <textarea
            value={entry.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Anything else on your mind today?"
            rows={3}
            className="w-full resize-none rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
          />
        )
      default:
        return null
    }
  }

  return (
    <PatientShell>
      {/* Heading + sub-nav (Log · Period · Photos) */}
      <div>
        <h1 className="font-cute text-2xl text-g-ink">Track</h1>
        <p className="mt-0.5 text-sm font-medium text-g-ink-3">Log how you feel — it all flows into your Insights.</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <span className="flex items-center justify-center gap-1.5 rounded-xl border border-transparent bg-g-pink py-2.5 text-xs font-semibold text-white">
          <ClipboardList size={13} /> Log
        </span>
        <Link href="/period" className="flex items-center justify-center gap-1.5 rounded-xl border border-g-border bg-white py-2.5 text-xs font-semibold text-g-ink-2 active:scale-95">
          <CalendarDays size={13} /> Period
        </Link>
        <Link href="/hirsutism" className="flex items-center justify-center gap-1.5 rounded-xl border border-g-border bg-white py-2.5 text-xs font-semibold text-g-ink-2 active:scale-95">
          <Camera size={13} /> Photos
        </Link>
      </div>

      {/* Date switcher */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => shiftDay(-1)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-g-ink-2 shadow-girly transition active:scale-90"
          aria-label="Previous day"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="font-cute text-2xl font-bold text-g-ink">{big}</div>
          <div className="text-sm font-semibold text-g-ink-3">{small}</div>
        </div>
        <button
          onClick={() => shiftDay(1)}
          disabled={isToday}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-g-ink-2 shadow-girly transition active:scale-90 disabled:opacity-30"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      {/* Completeness + saved pill */}
      <div className="mt-4 flex items-center justify-between rounded-3xl bg-candy-soft px-4 py-3">
        <span className="text-sm font-bold text-g-ink">
          {filled === 0 ? "Tap to log how you feel" : `${filled} of ${TRACKABLE_CATEGORIES} things logged`}
        </span>
        {ready && savedAt && (
          <span className="animate-pop rounded-full bg-white px-3 py-1 text-xs font-bold text-g-pink-deep">Saved</span>
        )}
      </div>

      {/* Customize entry point — her agency, one tap away */}
      <Link
        href="/track/customize"
        className="mt-3 flex items-center gap-2 rounded-2xl border border-g-border bg-white px-4 py-3 text-sm font-bold text-g-ink-2 shadow-girly active:scale-[0.99]"
      >
        <SlidersHorizontal size={15} className="text-g-pink-deep" />
        Customize what you track
        <span className="ml-auto text-g-ink-3">›</span>
      </Link>

      {/* Featured — what her goals put front and center */}
      {featured.map((id) => (
        <LogSection key={id} id={id} defaultOpen filled={sectionFilled(id, entry)}>
          {renderContent(id)}
        </LogSection>
      ))}

      {/* More to log — everything else, always here, just tucked away */}
      {more.length > 0 && (
        <section className="mt-6">
          <h2 className="px-1 font-cute text-lg font-bold text-g-ink">More to log</h2>
          <p className="mt-0.5 px-1 text-xs font-semibold text-g-ink-3">
            Everything else you can track, collapsed until you need it. Nothing is ever off-limits.
          </p>
          <div className="mt-2 space-y-2">
            {more.map((id) => (
              <LogSection key={id} id={id} filled={sectionFilled(id, entry)}>
                {renderContent(id)}
              </LogSection>
            ))}
          </div>
        </section>
      )}

      <MoreToTrack />

      <p className="mt-6 px-2 text-center text-xs font-semibold text-g-ink-3">
        MyPMOS is not a medical service and does not diagnose. For anything worrying, please see a doctor. 💗
      </p>
    </PatientShell>
  )
}

/** A collapsible section card. Featured ones start open; "more" ones start closed. */
function LogSection({
  id,
  filled,
  defaultOpen,
  children,
}: {
  id: SectionId
  filled: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const m = sectionMeta(id)
  const [open, setOpen] = useState(Boolean(defaultOpen))
  return (
    <section className={cn("overflow-hidden rounded-3xl border border-g-border bg-white shadow-girly", defaultOpen ? "mt-4" : "mt-0")}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 py-3.5 active:scale-[0.99]">
        <span className={cn("grid h-8 w-8 place-items-center rounded-full text-base", ACCENT[m.accent].soft)}>{m.emoji}</span>
        <h2 className="font-cute text-base font-bold text-g-ink">{m.title}</h2>
        {filled && <span className={cn("h-2 w-2 rounded-full", ACCENT[m.accent].dot)} aria-label="logged" />}
        <ChevronDown size={18} className={cn("ml-auto text-g-ink-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  )
}

/** The "everything you can log lives here" hub — other full-page trackers. */
function MoreToTrack() {
  const GROUPS: { title: string; items: { href: string; emoji: string; label: string; sub: string }[] }[] = [
    {
      title: "Body & labs",
      items: [
        { href: "/labs", emoji: "🧪", label: "Labs", sub: "AMH, testosterone, glucose…" },
        { href: "/import", emoji: "⌚️", label: "Activity & import", sub: "Steps, sleep, heart rate" },
      ],
    },
    {
      title: "Hair & skin",
      items: [
        { href: "/assessments", emoji: "📋", label: "Self-checks", sub: "Hair score, acne, mood, sleep" },
        { href: "/hirsutism", emoji: "🪶", label: "Symptom photos", sub: "Hair, skin & acne over time" },
      ],
    },
    {
      title: "About me",
      items: [
        { href: "/history", emoji: "🗂️", label: "Concern & birth control", sub: "What matters + BC history" },
        { href: "/symptoms", emoji: "📝", label: "Symptom profile", sub: "The full picture, once" },
        { href: "/health", emoji: "🩺", label: "Health profile", sub: "History, family, vitals" },
        { href: "/goals", emoji: "🎯", label: "My goals", sub: "Your top 2 to work on" },
      ],
    },
  ]
  return (
    <section className="mt-6">
      <h2 className="px-1 font-cute text-lg font-bold text-g-ink">More to track</h2>
      <p className="mt-0.5 px-1 text-xs font-semibold text-g-ink-3">
        Everything you can log, in one place. It all flows into your Insights and visit summary.
      </p>
      {GROUPS.map((g) => (
        <div key={g.title} className="mt-3">
          <p className="px-1 text-[0.7rem] font-bold uppercase tracking-wide text-g-ink-3">{g.title}</p>
          <div className="mt-1.5 overflow-hidden rounded-3xl border border-g-border bg-white shadow-girly">
            {g.items.map((it, i) => (
              <Link
                key={it.href}
                href={it.href}
                className={cn("flex items-center gap-3 px-4 py-3 active:scale-[0.99]", i > 0 && "border-t border-g-border")}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-candy-soft text-lg">{it.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-g-ink">{it.label}</span>
                  <span className="block text-xs font-medium text-g-ink-2">{it.sub}</span>
                </span>
                <span className="shrink-0 text-g-ink-3">›</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

// --- cute building blocks ----------------------------------------------------

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: number | string
  onChange: (v: string) => void
  step?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-g-ink-3">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 text-sm font-bold text-g-ink outline-none focus:border-g-pink"
      />
    </label>
  )
}

function Chip({
  option,
  accent,
  selected,
  onClick,
}: {
  option: ChipOption
  accent: GirlyAccent
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
        selected
          ? cn(ACCENT[accent].solid, "border-transparent text-white shadow-girly animate-pop")
          : "border-g-border bg-g-canvas text-g-ink-2 hover:border-g-border-2"
      )}
    >
      <span>{option.emoji}</span>
      <span>{option.label}</span>
    </button>
  )
}
