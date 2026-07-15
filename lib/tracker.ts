/**
 * MyPMOS tracker — the moat.
 *
 * "Track as many things as possible." This module defines the full catalog of
 * trackable things (period, mood, energy, symptoms, discharge, sleep, pain,
 * cravings, digestion, skin/hair, meds & supplements, lifestyle, notes) and a
 * tiny localStorage-backed store so the prototype works instantly with no
 * auth. Swap the store for Supabase later without touching the catalog or UI.
 */

export type DateKey = string // "YYYY-MM-DD"

/** A single day's log. Everything optional — log as little or as much as you like. */
export interface TrackEntry {
  date: DateKey
  flow?: "none" | "spotting" | "light" | "medium" | "heavy"
  moods?: string[]
  energy?: "high" | "ok" | "low" | "drained"
  symptoms?: string[]
  symptomSeverity?: Record<string, 1 | 2 | 3> // 1 mild · 2 moderate · 3 severe

  discharge?: string[]
  sleepHours?: number
  sleepQuality?: "great" | "ok" | "rough"
  pain?: number // 0–10
  cravings?: string[]
  digestion?: string[]
  skinHair?: string[]
  meds?: string[]
  water?: number // glasses
  movement?: string[]
  notes?: string
  // --- clinical measurements (optional, for trends + the gyno summary) ---
  weightKg?: number
  bbt?: number // basal body temp, °C
  bpSys?: number
  bpDia?: number
  ovTest?: "negative" | "high" | "peak"
  // --- activity & body metrics (manual or imported from Apple Health / Fit) ---
  steps?: number
  restingHr?: number // resting heart rate, bpm
  activeMin?: number // active / exercise minutes
  kcal?: number // dietary calories consumed
  updatedAt?: number
}

export const OV_TEST_OPTIONS: ChipOption[] = [
  { id: "negative", label: "Negative", emoji: "⚪️" },
  { id: "high", label: "High", emoji: "🟡" },
  { id: "peak", label: "Peak", emoji: "🔴" },
]

export interface ChipOption {
  id: string
  label: string
  emoji: string
}

export interface ChipGroup {
  key: keyof TrackEntry
  title: string
  emoji: string
  accent: GirlyAccent
  multi: boolean
  options: ChipOption[]
}

export type GirlyAccent = "pink" | "lavender" | "peach" | "mint" | "butter" | "sky"

/** Tailwind class bundles per accent, so cards/chips stay cute + consistent. */
export const ACCENT: Record<
  GirlyAccent,
  { soft: string; solid: string; ring: string; text: string; dot: string }
> = {
  pink: {
    soft: "bg-g-pink-soft", solid: "bg-g-pink", ring: "ring-g-pink",
    text: "text-g-pink-deep", dot: "bg-g-pink",
  },
  lavender: {
    soft: "bg-g-lavender-soft", solid: "bg-g-lavender", ring: "ring-g-lavender",
    text: "text-g-lavender", dot: "bg-g-lavender",
  },
  peach: {
    soft: "bg-g-peach-soft", solid: "bg-g-peach", ring: "ring-g-peach",
    text: "text-g-peach", dot: "bg-g-peach",
  },
  mint: {
    soft: "bg-g-mint-soft", solid: "bg-g-mint", ring: "ring-g-mint",
    text: "text-g-mint", dot: "bg-g-mint",
  },
  butter: {
    soft: "bg-g-butter-soft", solid: "bg-g-butter", ring: "ring-g-butter",
    text: "text-g-ink", dot: "bg-g-butter",
  },
  sky: {
    soft: "bg-g-sky-soft", solid: "bg-g-sky", ring: "ring-g-sky",
    text: "text-g-sky", dot: "bg-g-sky",
  },
}

/** Period flow has its own little scale (single-select, drop shape). */
export const FLOW_OPTIONS: ChipOption[] = [
  { id: "none", label: "None", emoji: "🤍" },
  { id: "spotting", label: "Spotting", emoji: "🩷" },
  { id: "light", label: "Light", emoji: "💧" },
  { id: "medium", label: "Medium", emoji: "🌸" },
  { id: "heavy", label: "Heavy", emoji: "🌹" },
]

export const ENERGY_OPTIONS: ChipOption[] = [
  { id: "high", label: "Buzzing", emoji: "⚡️" },
  { id: "ok", label: "Steady", emoji: "🙂" },
  { id: "low", label: "Low", emoji: "🥱" },
  { id: "drained", label: "Drained", emoji: "🫠" },
]

export const SLEEP_QUALITY_OPTIONS: ChipOption[] = [
  { id: "great", label: "Great", emoji: "😴" },
  { id: "ok", label: "Okay", emoji: "🌙" },
  { id: "rough", label: "Rough", emoji: "🥲" },
]

/** Multi-select chip groups — the breadth that makes the tracker the moat. */
export const CHIP_GROUPS: ChipGroup[] = [
  {
    key: "moods", title: "Mood", emoji: "💭", accent: "lavender", multi: true,
    options: [
      { id: "happy", label: "Happy", emoji: "😊" },
      { id: "calm", label: "Calm", emoji: "🧘‍♀️" },
      { id: "confident", label: "Confident", emoji: "💅" },
      { id: "sensitive", label: "Sensitive", emoji: "🥹" },
      { id: "anxious", label: "Anxious", emoji: "😰" },
      { id: "irritable", label: "Irritable", emoji: "😤" },
      { id: "sad", label: "Sad", emoji: "😢" },
      { id: "moodswings", label: "Mood swings", emoji: "🎢" },
      { id: "unmotivated", label: "Unmotivated", emoji: "😶‍🌫️" },
    ],
  },
  {
    key: "symptoms", title: "Symptoms", emoji: "🩹", accent: "pink", multi: true,
    options: [
      { id: "cramps", label: "Cramps", emoji: "🤕" },
      { id: "bloating", label: "Bloating", emoji: "🎈" },
      { id: "headache", label: "Headache", emoji: "💥" },
      { id: "backache", label: "Back pain", emoji: "🦴" },
      { id: "pelvic", label: "Pelvic pain", emoji: "🌷" },
      { id: "breast", label: "Tender chest", emoji: "🫶" },
      { id: "nausea", label: "Nausea", emoji: "🤢" },
      { id: "fatigue", label: "Fatigue", emoji: "🪫" },
      { id: "brainfog", label: "Brain fog", emoji: "🌫️" },
      { id: "dizzy", label: "Dizzy", emoji: "😵‍💫" },
      { id: "hotflash", label: "Hot flashes", emoji: "🥵" },
      { id: "insomnia", label: "Can't sleep", emoji: "🌜" },
    ],
  },
  {
    key: "skinHair", title: "Skin & hair", emoji: "✨", accent: "peach", multi: true,
    options: [
      { id: "clear", label: "Clear skin", emoji: "🌟" },
      { id: "acne", label: "Breakouts", emoji: "🔴" },
      { id: "oily", label: "Oily skin", emoji: "💧" },
      { id: "dry", label: "Dry skin", emoji: "🍂" },
      { id: "hairloss", label: "Hair shedding", emoji: "🍃" },
      { id: "newhair", label: "New facial hair", emoji: "🪒" },
      { id: "darkpatches", label: "Dark patches", emoji: "🟤" },
      { id: "skintags", label: "Skin tags", emoji: "📍" },
    ],
  },
  {
    key: "discharge", title: "Discharge", emoji: "💧", accent: "sky", multi: false,
    options: [
      { id: "dry", label: "Dry", emoji: "🍂" },
      { id: "sticky", label: "Sticky", emoji: "🍯" },
      { id: "creamy", label: "Creamy", emoji: "🥛" },
      { id: "eggwhite", label: "Egg-white", emoji: "🥚" },
      { id: "watery", label: "Watery", emoji: "💦" },
      { id: "unusual", label: "Unusual", emoji: "❓" },
    ],
  },
  {
    key: "cravings", title: "Cravings", emoji: "🍫", accent: "butter", multi: true,
    options: [
      { id: "sugar", label: "Sugar", emoji: "🍬" },
      { id: "chocolate", label: "Chocolate", emoji: "🍫" },
      { id: "carbs", label: "Carbs", emoji: "🍞" },
      { id: "salty", label: "Salty", emoji: "🥨" },
      { id: "caffeine", label: "Caffeine", emoji: "☕️" },
      { id: "none", label: "None", emoji: "🚫" },
    ],
  },
  {
    key: "digestion", title: "Digestion", emoji: "🌿", accent: "mint", multi: true,
    options: [
      { id: "normal", label: "Normal", emoji: "👍" },
      { id: "bloated", label: "Bloated", emoji: "🎈" },
      { id: "constipated", label: "Constipated", emoji: "🪨" },
      { id: "loose", label: "Loose", emoji: "💨" },
      { id: "gassy", label: "Gassy", emoji: "🌬️" },
      { id: "reflux", label: "Reflux", emoji: "🔥" },
    ],
  },
  {
    key: "movement", title: "Movement", emoji: "🤸‍♀️", accent: "sky", multi: true,
    options: [
      { id: "walk", label: "Walk", emoji: "🚶‍♀️" },
      { id: "strength", label: "Strength", emoji: "🏋️‍♀️" },
      { id: "yoga", label: "Yoga", emoji: "🧘‍♀️" },
      { id: "cardio", label: "Cardio", emoji: "🏃‍♀️" },
      { id: "dance", label: "Dance", emoji: "💃" },
      { id: "rest", label: "Rest day", emoji: "🛋️" },
    ],
  },
  {
    key: "meds", title: "Meds & supplements", emoji: "💊", accent: "lavender", multi: true,
    options: [
      { id: "inositol", label: "Inositol", emoji: "🩷" },
      { id: "metformin", label: "Metformin", emoji: "💊" },
      { id: "bc", label: "Birth control", emoji: "🗓️" },
      { id: "spiro", label: "Spironolactone", emoji: "💊" },
      { id: "vitd", label: "Vitamin D", emoji: "☀️" },
      { id: "omega", label: "Omega-3", emoji: "🐟" },
      { id: "magnesium", label: "Magnesium", emoji: "🪨" },
      { id: "iron", label: "Iron", emoji: "🩸" },
    ],
  },
]

// --- localStorage store ------------------------------------------------------

const KEY = "polaris.tracker.v1"

function isBrowser() {
  return typeof window !== "undefined"
}

function readAll(): Record<DateKey, TrackEntry> {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<DateKey, TrackEntry>) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<DateKey, TrackEntry>) {
  if (!isBrowser()) return
  window.localStorage.setItem(KEY, JSON.stringify(all))
}

export function toDateKey(d: Date): DateKey {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function getEntry(date: DateKey): TrackEntry {
  return readAll()[date] ?? { date }
}

export function saveEntry(entry: TrackEntry): void {
  const all = readAll()
  all[entry.date] = { ...entry, updatedAt: Date.now() }
  writeAll(all)
}

export function getAllEntries(): TrackEntry[] {
  return Object.values(readAll()).sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** How many fields the user filled — used for the "completeness" sparkle ring. */
export function entryFilledCount(e: TrackEntry): number {
  let n = 0
  if (e.flow) n++
  if (e.energy) n++
  if (e.sleepQuality || e.sleepHours) n++
  if (typeof e.pain === "number") n++
  if (e.notes && e.notes.trim()) n++
  if (typeof e.weightKg === "number") n++
  if (typeof e.bbt === "number") n++
  if (typeof e.bpSys === "number") n++
  if (e.ovTest) n++
  for (const g of CHIP_GROUPS) {
    const v = e[g.key]
    if (Array.isArray(v) ? v.length > 0 : Boolean(v)) n++
  }
  return n
}

/** Total number of trackable categories — the breadth headline. */
export const TRACKABLE_CATEGORIES = 5 + CHIP_GROUPS.length

/** Consecutive days (ending today or yesterday) with any logged entry. */
export function getStreak(all: TrackEntry[] = getAllEntries()): number {
  const logged = new Set(all.filter((e) => entryFilledCount(e) > 0).map((e) => e.date))
  let streak = 0
  const cursor = new Date()
  // Allow the streak to count from yesterday if today isn't logged yet.
  if (!logged.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (logged.has(toDateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
