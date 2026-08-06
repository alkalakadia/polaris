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
  icon?: string
}

export interface ChipGroup {
  key: keyof TrackEntry
  title: string
  emoji: string
  icon: string
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
  { id: "none", label: "None", emoji: "🤍", icon: "x" },
  { id: "spotting", label: "Spotting", emoji: "🩷", icon: "droplet" },
  { id: "light", label: "Light", emoji: "💧", icon: "droplet" },
  { id: "medium", label: "Medium", emoji: "🌸", icon: "heartPulse" },
  { id: "heavy", label: "Heavy", emoji: "🌹", icon: "heartPulse" },
]

export const ENERGY_OPTIONS: ChipOption[] = [
  { id: "high", label: "Buzzing", emoji: "⚡️", icon: "activity" },
  { id: "ok", label: "Steady", emoji: "🙂", icon: "checkCircle2" },
  { id: "low", label: "Low", emoji: "🥱", icon: "moon" },
  { id: "drained", label: "Drained", emoji: "🫠", icon: "cloud" },
]

export const SLEEP_QUALITY_OPTIONS: ChipOption[] = [
  { id: "great", label: "Great", emoji: "😴", icon: "moon" },
  { id: "ok", label: "Okay", emoji: "🌙", icon: "sun" },
  { id: "rough", label: "Rough", emoji: "🥲", icon: "cloud" },
]

/** Multi-select chip groups — the breadth that makes the tracker the moat. */
export const CHIP_GROUPS: ChipGroup[] = [
  {
    key: "moods", title: "Mood", emoji: "💭", icon: "messageCircle", accent: "lavender", multi: true,
    options: [
      { id: "happy", label: "Happy", emoji: "😊", icon: "happy" },
      { id: "calm", label: "Calm", emoji: "🧘", icon: "calm" },
      { id: "confident", label: "Confident", emoji: "💅", icon: "confident" },
      { id: "sensitive", label: "Sensitive", emoji: "🥹", icon: "sensitive" },
      { id: "anxious", label: "Anxious", emoji: "😰", icon: "anxious" },
      { id: "irritable", label: "Irritable", emoji: "😤", icon: "irritable" },
      { id: "sad", label: "Sad", emoji: "😢", icon: "sad" },
      { id: "moodswings", label: "Mood swings", emoji: "🎢", icon: "moodswings" },
      { id: "unmotivated", label: "Unmotivated", emoji: "😶‍🌫️", icon: "unmotivated" },
    ],
  },
  {
    key: "symptoms", title: "Symptoms", emoji: "🩹", icon: "heartPulse", accent: "pink", multi: true,
    options: [
      { id: "cramps", label: "Cramps", emoji: "🤕", icon: "cramps" },
      { id: "bloating", label: "Bloating", emoji: "🎈", icon: "bloating" },
      { id: "headache", label: "Headache", emoji: "💥", icon: "headache" },
      { id: "backache", label: "Back pain", emoji: "🦴", icon: "backache" },
      { id: "pelvic", label: "Pelvic pain", emoji: "🌷", icon: "pelvic" },
      { id: "breast", label: "Tender chest", emoji: "🫶", icon: "breast" },
      { id: "nausea", label: "Nausea", emoji: "🤢", icon: "nausea" },
      { id: "fatigue", label: "Fatigue", emoji: "🪫", icon: "fatigue" },
      { id: "brainfog", label: "Brain fog", emoji: "🌫️", icon: "brainfog" },
      { id: "dizzy", label: "Dizzy", emoji: "😵‍💫", icon: "dizzy" },
      { id: "hotflash", label: "Hot flashes", emoji: "🥵", icon: "hotflash" },
      { id: "insomnia", label: "Can't sleep", emoji: "🌜", icon: "insomnia" },
    ],
  },
  {
    key: "skinHair", title: "Skin & hair", emoji: "✨", icon: "heartPulse", accent: "peach", multi: true,
    options: [
      { id: "clear", label: "Clear skin", emoji: "🌟", icon: "star" },
      { id: "acne", label: "Breakouts", emoji: "🔴", icon: "heartPulse" },
      { id: "oily", label: "Oily skin", emoji: "💧", icon: "droplet" },
      { id: "dry", label: "Dry skin", emoji: "🍂", icon: "cloud" },
      { id: "hairloss", label: "Hair shedding", emoji: "🍃", icon: "leaf" },
      { id: "newhair", label: "New facial hair", emoji: "🪒", icon: "scissors" },
      { id: "darkpatches", label: "Dark patches", emoji: "🟤", icon: "square" },
      { id: "skintags", label: "Skin tags", emoji: "📍", icon: "mapPin" },
    ],
  },
  {
    key: "discharge", title: "Discharge", emoji: "💧", icon: "droplet", accent: "sky", multi: false,
    options: [
      { id: "dry", label: "Dry", emoji: "🍂", icon: "cloud" },
      { id: "sticky", label: "Sticky", emoji: "🍯", icon: "droplet" },
      { id: "creamy", label: "Creamy", emoji: "🥛", icon: "glassWater" },
      { id: "eggwhite", label: "Egg-white", emoji: "🥚", icon: "circle" },
      { id: "watery", label: "Watery", emoji: "💦", icon: "droplet" },
      { id: "unusual", label: "Unusual", emoji: "❓", icon: "help" },
    ],
  },
  {
    key: "cravings", title: "Cravings", emoji: "🍫", icon: "leaf", accent: "butter", multi: true,
    options: [
      { id: "sugar", label: "Sugar", emoji: "🍬", icon: "sugar" },
      { id: "chocolate", label: "Chocolate", emoji: "🍫", icon: "chocolate" },
      { id: "carbs", label: "Carbs", emoji: "🍞", icon: "carbs" },
      { id: "salty", label: "Salty", emoji: "🥨", icon: "salty" },
      { id: "caffeine", label: "Caffeine", emoji: "☕️", icon: "caffeine" },
      { id: "none", label: "None", emoji: "🚫", icon: "none" },
    ],
  },
  {
    key: "digestion", title: "Digestion", emoji: "🌿", icon: "leaf", accent: "mint", multi: true,
    options: [
      { id: "normal", label: "Normal", emoji: "👍", icon: "normal" },
      { id: "bloated", label: "Bloated", emoji: "🎈", icon: "bloating" },
      { id: "constipated", label: "Constipated", emoji: "🪨", icon: "constipated" },
      { id: "loose", label: "Loose", emoji: "💨", icon: "loose" },
      { id: "gassy", label: "Gassy", emoji: "🌬️", icon: "gassy" },
      { id: "reflux", label: "Reflux", emoji: "🔥", icon: "reflux" },
    ],
  },
  {
    key: "movement", title: "Movement", emoji: "🤸", icon: "activity", accent: "sky", multi: true,
    options: [
      { id: "walk", label: "Walk", emoji: "🚶", icon: "walk" },
      { id: "strength", label: "Strength", emoji: "🏋️", icon: "strength" },
      { id: "yoga", label: "Yoga", emoji: "🧘", icon: "yoga" },
      { id: "cardio", label: "Cardio", emoji: "🏃", icon: "cardio" },
      { id: "dance", label: "Dance", emoji: "💃", icon: "dance" },
      { id: "rest", label: "Rest day", emoji: "🛋️", icon: "rest" },
    ],
  },
  {
    key: "meds", title: "Meds & supplements", emoji: "💊", icon: "pill", accent: "lavender", multi: true,
    options: [
      { id: "inositol", label: "Inositol", emoji: "🩷", icon: "heartPulse" },
      { id: "metformin", label: "Metformin", emoji: "💊", icon: "pill" },
      { id: "bc", label: "Birth control", emoji: "🗓️", icon: "calendar" },
      { id: "spiro", label: "Spironolactone", emoji: "💊", icon: "pill" },
      { id: "vitd", label: "Vitamin D", emoji: "☀️", icon: "sun" },
      { id: "omega", label: "Omega-3", emoji: "🐟", icon: "fish" },
      { id: "magnesium", label: "Magnesium", emoji: "🪨", icon: "square" },
      { id: "iron", label: "Iron", emoji: "🩸", icon: "droplet" },
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
