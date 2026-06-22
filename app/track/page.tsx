"use client"

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
  type ChipGroup,
  type ChipOption,
  type GirlyAccent,
  type TrackEntry,
} from "@/lib/tracker"
import { getProfile } from "@/lib/profile"

function prettyDate(key: string): { big: string; small: string; isToday: boolean } {
  const today = toDateKey(new Date())
  const d = new Date(key + "T00:00:00")
  const isToday = key === today
  const big = isToday
    ? "Today"
    : d.toLocaleDateString("en-US", { weekday: "long" })
  const small = d.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  return { big, small, isToday }
}

export default function TrackPage() {
  const { user } = useAuth()
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()))
  const [entry, setEntry] = useState<TrackEntry>({ date: dateKey })
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  // Load whenever the selected day (or signed-in user) changes.
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
      void saveEntryAsync(next) // instant local write + cloud upsert when signed in
      return next
    })
    setSavedAt(Date.now())
  }

  function toggleMulti(key: keyof TrackEntry, id: string) {
    const current = (entry[key] as string[] | undefined) ?? []
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id]
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
  const units = (typeof window !== "undefined" ? getProfile().units : "us") ?? "us"
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

  return (
    <PatientShell>
      {/* Date switcher */}
      <div className="flex items-center justify-between">
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
          {filled === 0
            ? "Tap to log how you feel 💕"
            : `${filled} of ${TRACKABLE_CATEGORIES} things logged ✨`}
        </span>
        {ready && savedAt && (
          <span className="animate-pop rounded-full bg-white px-3 py-1 text-xs font-bold text-g-pink-deep">
            Saved 🩷
          </span>
        )}
      </div>

      {/* Period flow */}
      <SingleSelectCard
        title="Period flow"
        emoji="🌷"
        accent="pink"
        options={FLOW_OPTIONS}
        value={entry.flow}
        onPick={(id) => toggleSingle("flow", id)}
      />

      {/* Energy */}
      <SingleSelectCard
        title="Energy"
        emoji="⚡️"
        accent="butter"
        options={ENERGY_OPTIONS}
        value={entry.energy}
        onPick={(id) => toggleSingle("energy", id)}
      />

      {/* Sleep */}
      <Card title="Sleep" emoji="😴" accent="lavender">
        <div className="flex flex-wrap items-center gap-2">
          {SLEEP_QUALITY_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              option={o}
              accent="lavender"
              selected={entry.sleepQuality === o.id}
              onClick={() => toggleSingle("sleepQuality", o.id)}
            />
          ))}
          <div className="ml-auto flex items-center gap-2 rounded-full bg-g-lavender-soft px-3 py-1.5">
            <span className="text-sm font-bold text-g-ink">
              {entry.sleepHours ?? 0}h
            </span>
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
      </Card>

      {/* Pain */}
      <Card title="Pain level" emoji="🩹" accent="pink">
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
      </Card>

      {/* All the multi/single chip groups — the breadth */}
      {CHIP_GROUPS.map((group) =>
        group.key === "symptoms" ? (
          <SeverityGroupCard
            key={group.key as string}
            group={group}
            entry={entry}
            onCycle={(id) => cycleSeverity(id)}
          />
        ) : (
          <ChipGroupCard
            key={group.key as string}
            group={group}
            entry={entry}
            onToggle={(id) =>
              group.multi
                ? toggleMulti(group.key, id)
                : toggleSingleArray(group.key, id)
            }
          />
        )
      )}

      {/* Water */}
      <Card title="Water" emoji="💦" accent="sky">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => {
            const on = (entry.water ?? 0) > i
            return (
              <button
                key={i}
                onClick={() => update({ water: on && (entry.water ?? 0) === i + 1 ? i : i + 1 })}
                className={cn(
                  "text-2xl transition active:scale-90",
                  on ? "opacity-100" : "opacity-30 grayscale"
                )}
                aria-label={`${i + 1} glasses of water`}
              >
                🥤
              </button>
            )
          })}
        </div>
      </Card>

      {/* Measurements — for trends + the gyno summary */}
      <Card title="Measurements" emoji="📏" accent="sky">
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
      </Card>

      {/* Notes */}
      <Card title="Notes" emoji="📝" accent="mint">
        <textarea
          value={entry.notes ?? ""}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Anything else on your mind today, bestie? 💭"
          rows={3}
          className="w-full resize-none rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
        />
      </Card>

      <p className="mt-6 px-2 text-center text-xs font-semibold text-g-ink-3">
        Polaris is not a medical service and does not diagnose. For anything
        worrying, please see a doctor. 💗
      </p>
    </PatientShell>
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

function Card({
  title,
  emoji,
  accent,
  children,
}: {
  title: string
  emoji: string
  accent: GirlyAccent
  children: React.ReactNode
}) {
  return (
    <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("grid h-8 w-8 place-items-center rounded-full text-base", ACCENT[accent].soft)}>
          {emoji}
        </span>
        <h2 className="font-cute text-base font-bold text-g-ink">{title}</h2>
      </div>
      {children}
    </section>
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

function SingleSelectCard({
  title,
  emoji,
  accent,
  options,
  value,
  onPick,
}: {
  title: string
  emoji: string
  accent: GirlyAccent
  options: ChipOption[]
  value?: string
  onPick: (id: string) => void
}) {
  return (
    <Card title={title} emoji={emoji} accent={accent}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.id} option={o} accent={accent} selected={value === o.id} onClick={() => onPick(o.id)} />
        ))}
      </div>
    </Card>
  )
}

function ChipGroupCard({
  group,
  entry,
  onToggle,
}: {
  group: ChipGroup
  entry: TrackEntry
  onToggle: (id: string) => void
}) {
  const selected = (entry[group.key] as string[] | undefined) ?? []
  return (
    <Card title={group.title} emoji={group.emoji} accent={group.accent}>
      <div className="flex flex-wrap gap-2">
        {group.options.map((o) => (
          <Chip
            key={o.id}
            option={o}
            accent={group.accent}
            selected={selected.includes(o.id)}
            onClick={() => onToggle(o.id)}
          />
        ))}
      </div>
    </Card>
  )
}

/** Symptoms with tap-to-cycle severity: mild → moderate → severe. */
function SeverityGroupCard({
  group,
  entry,
  onCycle,
}: {
  group: ChipGroup
  entry: TrackEntry
  onCycle: (id: string) => void
}) {
  const sev = entry.symptomSeverity ?? {}
  return (
    <Card title={group.title} emoji={group.emoji} accent={group.accent}>
      <p className="mb-2.5 text-xs font-semibold text-g-ink-3">Tap to set how strong: mild → moderate → severe</p>
      <div className="flex flex-wrap gap-2">
        {group.options.map((o) => {
          const level: number = sev[o.id] ?? 0
          return (
            <button
              key={o.id}
              onClick={() => onCycle(o.id)}
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
    </Card>
  )
}
