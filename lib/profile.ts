/**
 * Cycle profile — the personalization seed captured at onboarding.
 *
 * Stored in localStorage (instant, offline) and, when signed in, mirrored into
 * Supabase auth user_metadata so it syncs across devices with no extra table.
 */

import { browserClient } from "@/lib/supabase"

export type Goal = "ttc" | "regulate" | "symptoms" | "understand" | "weight"

export interface CycleProfile {
  name?: string
  lastPeriodStart?: string // YYYY-MM-DD
  cycleLength?: number // average days
  cycleIrregular?: boolean
  periodLength?: number // days
  goal?: Goal
  concerns?: string[]
  completedAt?: number
}

export const GOALS: { id: Goal; label: string; emoji: string; blurb: string }[] = [
  { id: "regulate", label: "Regulate my cycle", emoji: "🗓️", blurb: "Get to a more predictable rhythm" },
  { id: "symptoms", label: "Manage my symptoms", emoji: "🌸", blurb: "Feel better day to day" },
  { id: "ttc", label: "Trying to conceive", emoji: "🤍", blurb: "Understand my fertile window" },
  { id: "understand", label: "Understand my body", emoji: "✨", blurb: "Learn what's normal for me" },
  { id: "weight", label: "Feel good in my body", emoji: "💪", blurb: "Energy, weight & wellbeing" },
]

export const CONCERNS: { id: string; label: string; emoji: string }[] = [
  { id: "irregular", label: "Irregular periods", emoji: "🌀" },
  { id: "acne", label: "Acne", emoji: "🔴" },
  { id: "hair", label: "Hair changes", emoji: "💇‍♀️" },
  { id: "weight", label: "Weight", emoji: "⚖️" },
  { id: "mood", label: "Mood", emoji: "💭" },
  { id: "fatigue", label: "Fatigue", emoji: "🪫" },
  { id: "fertility", label: "Fertility", emoji: "🤍" },
  { id: "cramps", label: "Cramps & pain", emoji: "🤕" },
]

const KEY = "polaris.profile.v1"

export function getProfile(): CycleProfile {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as CycleProfile
  } catch {
    return {}
  }
}

export function saveProfile(p: CycleProfile): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(p))
  // Best-effort cross-device sync via auth metadata when signed in.
  const c = browserClient()
  if (c) {
    c.auth.updateUser({ data: { cycle: p } }).catch(() => {})
  }
}

/** Pull a cloud-stored profile down to this device after sign-in (if richer). */
export function hydrateProfileFromMetadata(cycle: unknown): void {
  if (typeof window === "undefined" || !cycle || typeof cycle !== "object") return
  const incoming = cycle as CycleProfile
  const local = getProfile()
  // Prefer whichever was completed more recently.
  if ((incoming.completedAt ?? 0) >= (local.completedAt ?? 0)) {
    window.localStorage.setItem(KEY, JSON.stringify(incoming))
  }
}

export function hasOnboarded(p: CycleProfile = getProfile()): boolean {
  return Boolean(p.completedAt)
}
