/**
 * MyPMOS insights — honest, NON-diagnostic pattern summaries computed from the
 * user's own tracked data. These are gentle observations and prompts to talk to
 * a doctor. Nothing here is a diagnosis, a medical claim, or a substitute for
 * care. Every "watch-out" is framed as "worth mentioning to your gyno."
 */

import {
  CHIP_GROUPS,
  entryFilledCount,
  type ChipOption,
  type TrackEntry,
} from "@/lib/tracker"
import { computeCycle, deriveLastPeriodStart } from "@/lib/cycle"
import type { CycleProfile } from "@/lib/profile"

export interface CountItem {
  option: ChipOption
  count: number
  group: string
}

export interface InsightSummary {
  daysTracked: number
  flowDays: number
  avgPain: number | null
  avgSleep: number | null
  topSymptoms: CountItem[]
  topMoods: CountItem[]
  watchOuts: WatchOut[]
  enoughData: boolean
}

export interface WatchOut {
  emoji: string
  title: string
  body: string
}

function tally(entries: TrackEntry[], key: keyof TrackEntry): Map<string, number> {
  const m = new Map<string, number>()
  for (const e of entries) {
    const v = e[key]
    if (Array.isArray(v)) for (const id of v) m.set(id, (m.get(id) ?? 0) + 1)
    else if (typeof v === "string") m.set(v, (m.get(v) ?? 0) + 1)
  }
  return m
}

function topFromGroup(entries: TrackEntry[], groupKey: keyof TrackEntry, n: number): CountItem[] {
  const group = CHIP_GROUPS.find((g) => g.key === groupKey)
  if (!group) return []
  const counts = tally(entries, groupKey)
  return [...counts.entries()]
    .map(([id, count]) => {
      const option = group.options.find((o) => o.id === id)
      return option ? { option, count, group: group.title } : null
    })
    .filter((x): x is CountItem => x !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

export interface CyclePattern {
  emoji: string
  label: string
  count: number
  phaseHint: string
}

/**
 * Cycle-relative patterns: "your cramps cluster ~2 days before your period."
 * For each symptom, computes when in the cycle it tends to occur (days before
 * the next period) and surfaces tight, repeated clusters. Estimates only.
 */
export function buildCyclePatterns(entries: TrackEntry[], profile: CycleProfile): CyclePattern[] {
  if (!profile.completedAt) return []
  const anchor = deriveLastPeriodStart(entries) ?? profile.lastPeriodStart ?? null
  if (!anchor) return []

  const symGroup = CHIP_GROUPS.find((g) => g.key === "symptoms")
  if (!symGroup) return []

  const buckets = new Map<string, number[]>()
  for (const e of entries) {
    const syms = e.symptoms as string[] | undefined
    if (!syms || syms.length === 0) continue
    const cs = computeCycle(profile, anchor, e.date)
    if (cs.cycleDay === null || cs.nextPeriodInDays === null) continue
    const daysBefore = cs.isLate ? 0 : cs.nextPeriodInDays
    for (const s of syms) {
      const arr = buckets.get(s) ?? []
      arr.push(daysBefore)
      buckets.set(s, arr)
    }
  }

  const cycleLen = profile.cycleLength || 28
  const out: CyclePattern[] = []
  for (const [id, arr] of buckets) {
    if (arr.length < 3) continue
    const sorted = [...arr].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const within = arr.filter((v) => Math.abs(v - median) <= 4).length
    if (within / arr.length < 0.6) continue // not a tight cluster
    const opt = symGroup.options.find((o) => o.id === id)
    if (!opt) continue
    const phaseHint =
      median <= 2 ? "right before your period"
      : median <= 6 ? `about ${median} days before your period`
      : median >= cycleLen - 6 ? "around the start of your cycle"
      : "in the middle of your cycle"
    out.push({ emoji: opt.emoji, label: opt.label, count: arr.length, phaseHint })
  }
  return out.sort((a, b) => b.count - a.count).slice(0, 3)
}

export function buildInsights(entries: TrackEntry[]): InsightSummary {
  const logged = entries.filter((e) => entryFilledCount(e) > 0)
  const daysTracked = logged.length

  const flowDays = logged.filter((e) => e.flow && e.flow !== "none").length

  const pains = logged.map((e) => e.pain).filter((p): p is number => typeof p === "number")
  const avgPain = pains.length ? pains.reduce((a, b) => a + b, 0) / pains.length : null

  const sleeps = logged.map((e) => e.sleepHours).filter((s): s is number => typeof s === "number" && s > 0)
  const avgSleep = sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : null

  const topSymptoms = topFromGroup(logged, "symptoms", 3)
  const topMoods = topFromGroup(logged, "moods", 3)

  // --- gentle, non-diagnostic "worth mentioning to your gyno" prompts -------
  const watchOuts: WatchOut[] = []
  const skinHair = tally(logged, "skinHair")
  const symptoms = tally(logged, "symptoms")

  if ((skinHair.get("newhair") ?? 0) >= 2 || (skinHair.get("darkpatches") ?? 0) >= 2) {
    watchOuts.push({
      emoji: "💛",
      title: "Skin & hair changes you've noted",
      body: "You've logged new hair growth or dark skin patches a few times. These are common things to bring up at a gyno visit — your PDF can help you remember.",
    })
  }
  if ((skinHair.get("acne") ?? 0) >= 3) {
    watchOuts.push({
      emoji: "🌸",
      title: "Breakouts showing up often",
      body: "Persistent breakouts are worth a chat with a dermatologist or gyno, especially alongside cycle changes.",
    })
  }
  if (daysTracked >= 35 && flowDays === 0) {
    watchOuts.push({
      emoji: "🗓️",
      title: "No period logged in a while",
      body: "It's been over a month of tracking with no period logged. Cycle gaps are something a doctor can help you understand.",
    })
  }
  if ((symptoms.get("fatigue") ?? 0) >= 4 || (symptoms.get("brainfog") ?? 0) >= 4) {
    watchOuts.push({
      emoji: "🫧",
      title: "Low energy keeps coming up",
      body: "Frequent fatigue or brain fog has its own list of possible causes. A doctor can check what's going on for you.",
    })
  }

  return {
    daysTracked,
    flowDays,
    avgPain,
    avgSleep,
    topSymptoms,
    topMoods,
    watchOuts,
    enoughData: daysTracked >= 3,
  }
}
