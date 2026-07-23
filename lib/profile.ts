/**
 * Cycle profile — the personalization seed captured at onboarding.
 *
 * Stored in localStorage (instant, offline) and, when signed in, mirrored into
 * Supabase auth user_metadata so it syncs across devices with no extra table.
 */

import { browserClient } from "@/lib/supabase"

export type Goal = "ttc" | "regulate" | "symptoms" | "understand" | "weight"

export interface LabResult {
  name: string
  value: string
  date?: string
}

export interface CycleProfile {
  name?: string
  lastPeriodStart?: string // YYYY-MM-DD
  cycleLength?: number // average days
  cycleIrregular?: boolean
  periodLength?: number // days
  goal?: Goal // primary goal (= goals[0]); kept for back-compat with insights/learn
  goals?: Goal[] // what brought her here — up to 3, drives which trackers lead
  concerns?: string[]
  completedAt?: number

  /**
   * How she has personalized her Log surface. Goals set smart defaults; these
   * are her explicit overrides on top. Nothing here removes a tracker — hidden
   * sections still live in Settings and keep any history already logged.
   */
  trackPrefs?: { pinned?: string[]; hidden?: string[]; order?: string[] }

  // --- richer health profile (clinical context for the PDF + AI) ---
  units?: "us" | "metric"
  heightCm?: number
  menarcheAge?: number // age of first period
  longestGapDays?: number // longest gap between periods
  diagnosis?: "diagnosed" | "suspected" | "exploring" | "no"
  familyHistory?: string[]
  contraception?: string
  pregnancyIntent?: string
  labs?: LabResult[]
  symptomProfile?: Record<string, string[]> // Layer 2: categoryId -> item ids
}

export const DIAGNOSIS_OPTIONS = [
  { id: "diagnosed", label: "Diagnosed with PMOS" },
  { id: "suspected", label: "Suspected / in workup" },
  { id: "exploring", label: "Just exploring" },
  { id: "no", label: "Not PMOS-related" },
]

export const FAMILY_HISTORY = [
  { id: "pcos", label: "PMOS" },
  { id: "diabetes", label: "Type 2 diabetes" },
  { id: "thyroid", label: "Thyroid issues" },
  { id: "infertility", label: "Infertility" },
  { id: "heart", label: "Early heart disease" },
  { id: "none", label: "None known" },
]

export const CONTRACEPTION = [
  { id: "none", label: "None" },
  { id: "pill", label: "The pill" },
  { id: "iud_h", label: "Hormonal IUD" },
  { id: "iud_c", label: "Copper IUD" },
  { id: "implant", label: "Implant" },
  { id: "ring", label: "Ring" },
  { id: "other", label: "Other" },
]

export const PREGNANCY_INTENT = [
  { id: "ttc", label: "Trying now" },
  { id: "soon", label: "Hoping soon" },
  { id: "avoiding", label: "Avoiding pregnancy" },
  { id: "notnow", label: "Not right now" },
  { id: "unsure", label: "Unsure" },
]

export function labelFor(list: { id: string; label: string }[], id?: string): string | undefined {
  return list.find((x) => x.id === id)?.label
}

/** BMI from stored metric values + a logged weight in kg. */
export function bmi(heightCm?: number, weightKg?: number): number | null {
  if (!heightCm || !weightKg) return null
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
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
  { id: "hair", label: "Hair changes", emoji: "💇" },
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
