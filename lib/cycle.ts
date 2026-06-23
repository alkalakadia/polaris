/**
 * Cycle estimation. Turns the onboarding profile (+ real logged periods) into
 * "where am I today": cycle day, phase, predicted next period, fertile window.
 *
 * These are ESTIMATES from the user's own averages. PCOS cycles are often
 * irregular, so everything here is framed as a gentle guide, never a fact and
 * never medical advice. As the user logs real period days, we anchor to those
 * instead of the onboarding date, so predictions self-correct.
 */

import { toDateKey, type TrackEntry } from "@/lib/tracker"
import type { CycleProfile, Goal } from "@/lib/profile"

export type Phase = "menstrual" | "follicular" | "ovulation" | "luteal" | "unknown"

export interface CycleStatus {
  cycleDay: number | null
  phase: Phase
  nextPeriodDate: string | null
  nextPeriodInDays: number | null
  isLate: boolean
  daysLate: number
  fertileWindow: boolean
  cycleLength: number
  irregular: boolean
  anchorDate: string | null
}

function parse(d: string): Date {
  return new Date(d + "T00:00:00")
}
function addDays(d: string, n: number): string {
  const x = parse(d)
  x.setDate(x.getDate() + n)
  return toDateKey(x)
}
function diffDays(a: string, b: string): number {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 86_400_000)
}

/** All period START dates (a flow day whose previous day had none), ascending. */
export function detectPeriodStarts(entries: TrackEntry[]): string[] {
  const flowDays = new Set(entries.filter((e) => e.flow && e.flow !== "none").map((e) => e.date))
  const starts: string[] = []
  for (const d of flowDays) {
    if (!flowDays.has(addDays(d, -1))) starts.push(d)
  }
  return starts.sort()
}

/**
 * Find the most recent period START from logged entries. Lets predictions track
 * reality, not the onboarding form.
 */
export function deriveLastPeriodStart(entries: TrackEntry[]): string | null {
  const starts = detectPeriodStarts(entries)
  return starts.length ? starts[starts.length - 1] : null
}

export interface CycleHistory {
  starts: string[]
  lengths: number[] // actual cycle lengths between consecutive starts
  average: number | null
  shortest: number | null
  longest: number | null
  regularity: "regular" | "irregular" | "unknown"
  count: number
}

/** Cycle lengths + regularity learned from the user's own logged periods. */
export function cycleHistory(entries: TrackEntry[]): CycleHistory {
  const starts = detectPeriodStarts(entries)
  const lengths: number[] = []
  for (let i = 1; i < starts.length; i++) lengths.push(diffDays(starts[i], starts[i - 1]))
  const valid = lengths.filter((l) => l >= 15 && l <= 90) // ignore noise
  const average = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
  const shortest = valid.length ? Math.min(...valid) : null
  const longest = valid.length ? Math.max(...valid) : null
  let regularity: CycleHistory["regularity"] = "unknown"
  if (valid.length >= 2) regularity = longest! - shortest! > 9 ? "irregular" : "regular"
  return { starts, lengths: valid, average, shortest, longest, regularity, count: starts.length }
}

/** Is the user on their period today (logged flow on this date)? */
export function isOnPeriod(entries: TrackEntry[], todayKey: string): boolean {
  const e = entries.find((x) => x.date === todayKey)
  return Boolean(e?.flow && e.flow !== "none")
}

export function computeCycle(
  profile: CycleProfile,
  loggedLastPeriod: string | null = null,
  today: string = toDateKey(new Date()),
  avgOverride: number | null = null
): CycleStatus {
  // Prefer the cycle length learned from real logged periods, else onboarding.
  const cycleLength =
    avgOverride && avgOverride > 0
      ? avgOverride
      : profile.cycleLength && profile.cycleLength > 0
        ? profile.cycleLength
        : 28
  const periodLength = profile.periodLength && profile.periodLength > 0 ? profile.periodLength : 5
  const irregular = Boolean(profile.cycleIrregular)

  // Anchor to the most recent of (logged period start, onboarding date).
  const candidates = [loggedLastPeriod, profile.lastPeriodStart].filter(Boolean) as string[]
  const anchor = candidates.sort((a, b) => (a < b ? 1 : -1))[0] ?? null

  const empty: CycleStatus = {
    cycleDay: null, phase: "unknown", nextPeriodDate: null, nextPeriodInDays: null,
    isLate: false, daysLate: 0, fertileWindow: false, cycleLength, irregular, anchorDate: null,
  }
  if (!anchor) return empty

  // Works for dates before the anchor too (floor handles negatives), so we can
  // place historical entries on the cyclic schedule for pattern detection.
  const daysSince = diffDays(today, anchor)
  const cyclesPassed = Math.floor(daysSince / cycleLength)
  const currentStart = addDays(anchor, cyclesPassed * cycleLength)
  const cycleDay = diffDays(today, currentStart) + 1
  const nextPeriodDate = addDays(currentStart, cycleLength)
  const nextPeriodInDays = diffDays(nextPeriodDate, today)
  const isLate = nextPeriodInDays < 0
  const daysLate = isLate ? -nextPeriodInDays : 0

  // Ovulation ~14 days before next period; fertile window ovulation-5 .. +1.
  const ovulationDay = cycleLength - 14
  const fertileWindow = cycleDay >= ovulationDay - 5 && cycleDay <= ovulationDay + 1

  let phase: Phase
  if (isLate) phase = "luteal"
  else if (cycleDay <= periodLength) phase = "menstrual"
  else if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) phase = "ovulation"
  else if (cycleDay < ovulationDay - 1) phase = "follicular"
  else phase = "luteal"

  return {
    cycleDay, phase, nextPeriodDate, nextPeriodInDays, isLate, daysLate,
    fertileWindow, cycleLength, irregular, anchorDate: anchor,
  }
}

export const PHASE_META: Record<Phase, { label: string; emoji: string; tint: string; blurb: string }> = {
  menstrual: { label: "Period", emoji: "🌹", tint: "bg-g-pink-soft", blurb: "Rest and be gentle with yourself" },
  follicular: { label: "Follicular", emoji: "🌱", tint: "bg-g-mint-soft", blurb: "Energy is usually on the rise" },
  ovulation: { label: "Ovulation", emoji: "✨", tint: "bg-g-peach-soft", blurb: "Your fertile window, if cycles are regular" },
  luteal: { label: "Luteal", emoji: "🌙", tint: "bg-g-lavender-soft", blurb: "A natural wind-down phase" },
  unknown: { label: "Let's find out", emoji: "🌸", tint: "bg-candy-soft", blurb: "Tell us about your cycle to personalize" },
}

/** A warm, non-medical tip tailored to the phase AND the user's goal. */
export function phaseTip(phase: Phase, goal?: Goal): string {
  const byPhase: Record<Phase, string> = {
    menstrual: "Cramps and low energy are common now. Warmth, rest, and iron-rich foods can feel good.",
    follicular: "Many people feel more energetic and social here. A good time for movement you enjoy.",
    ovulation: "Energy and libido often peak. If you're tracking fertility, this is the window to watch.",
    luteal: "Cravings, bloating, and mood dips are common before a period. Protein and gentle movement help.",
    unknown: "Add your last period and cycle length to unlock daily, personalized guidance.",
  }
  const byGoalNudge: Partial<Record<Goal, Partial<Record<Phase, string>>>> = {
    ttc: {
      follicular: "As you approach ovulation, this is a key time to track for conception.",
      ovulation: "This is your most fertile window. Logging helps you spot your pattern.",
    },
    symptoms: {
      luteal: "This is when symptoms often spike. Logging now builds the picture for your gyno.",
      menstrual: "Note your pain and flow today. It all helps you and your doctor see the trend.",
    },
    regulate: {
      luteal: "Tracking when your period actually arrives is how Polaris learns your real rhythm.",
    },
    weight: {
      luteal: "Cravings now are hormonal, not a willpower thing. Be kind to yourself.",
    },
  }
  return byGoalNudge[goal as Goal]?.[phase] ?? byPhase[phase]
}
