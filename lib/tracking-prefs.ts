/**
 * Log personalization — "her app, not a template."
 *
 * A mentor's note: give users agency over what they track, and shape the app
 * around the goals they picked, without shadowing those priorities or piling on
 * clutter. This module is that logic.
 *
 * The rule that keeps it safe: personalizing only ever changes what LEADS and
 * what sits quietly below. It never removes a tracker and never deletes data.
 * Every section is always reachable, and everything logged still flows into one
 * Insights. Goals set smart defaults; the user's pins/hides/order override them.
 */

import type { CycleProfile, Goal } from "@/lib/profile"
import type { GirlyAccent } from "@/lib/tracker"

export type SectionId =
  | "period"
  | "energy"
  | "sleep"
  | "pain"
  | "moods"
  | "symptoms"
  | "skinHair"
  | "discharge"
  | "cravings"
  | "digestion"
  | "movement"
  | "meds"
  | "water"
  | "measurements"
  | "notes"

export interface SectionMeta {
  id: SectionId
  title: string
  emoji: string
  accent: GirlyAccent
  /** Goals that feature this section up top. */
  goals: Goal[]
  /** Always featured, can never be hidden — the clinical core everyone keeps. */
  core?: boolean
  /** One-line description for the customize screen. */
  desc: string
}

/**
 * The full catalog. `goals` decides what a given goal surfaces; `core` marks the
 * handful a gyno needs regardless. Order here is the default vertical order.
 */
export const LOG_SECTIONS: SectionMeta[] = [
  { id: "period", title: "Period", emoji: "🌹", accent: "pink", core: true, goals: ["regulate", "ttc", "understand"], desc: "Flow & period days" },
  { id: "moods", title: "Mood", emoji: "💭", accent: "lavender", core: true, goals: ["symptoms", "understand"], desc: "How you feel emotionally" },
  { id: "symptoms", title: "Symptoms", emoji: "🩹", accent: "pink", goals: ["symptoms", "regulate", "understand"], desc: "Cramps, bloating, fatigue…" },
  { id: "pain", title: "Pain level", emoji: "🩹", accent: "pink", goals: ["symptoms"], desc: "0–10 pain scale" },
  { id: "energy", title: "Energy", emoji: "⚡️", accent: "butter", goals: ["weight", "understand"], desc: "How energized you feel" },
  { id: "sleep", title: "Sleep", emoji: "😴", accent: "lavender", goals: ["symptoms", "weight", "regulate"], desc: "Quality & hours" },
  { id: "skinHair", title: "Skin & hair", emoji: "✨", accent: "peach", goals: ["symptoms"], desc: "Breakouts, hair changes" },
  { id: "discharge", title: "Discharge", emoji: "💧", accent: "sky", goals: ["ttc", "regulate"], desc: "Cervical fluid" },
  { id: "cravings", title: "Cravings", emoji: "🍫", accent: "butter", goals: ["weight"], desc: "What you're craving" },
  { id: "digestion", title: "Digestion", emoji: "🌿", accent: "mint", goals: ["symptoms", "weight"], desc: "Bloating, gut feel" },
  { id: "movement", title: "Movement", emoji: "🤸‍♀️", accent: "sky", goals: ["weight"], desc: "Activity you did" },
  { id: "water", title: "Water", emoji: "💦", accent: "sky", goals: ["weight"], desc: "Glasses today" },
  { id: "meds", title: "Meds & supplements", emoji: "💊", accent: "lavender", goals: ["symptoms", "regulate"], desc: "What you took" },
  { id: "measurements", title: "Measurements", emoji: "📏", accent: "sky", goals: ["ttc", "weight"], desc: "Weight, temp, BP, ov test" },
  { id: "notes", title: "Notes", emoji: "📝", accent: "mint", core: true, goals: [], desc: "Anything else on your mind" },
]

export const SECTION_ORDER: SectionId[] = LOG_SECTIONS.map((s) => s.id)

export function sectionMeta(id: SectionId): SectionMeta {
  return LOG_SECTIONS.find((s) => s.id === id) ?? LOG_SECTIONS[0]
}

export interface TrackPrefs {
  pinned?: SectionId[]
  hidden?: SectionId[]
  order?: SectionId[]
}

/** Goals a user actually picked (multi, falling back to the legacy single goal). */
export function profileGoals(profile: CycleProfile): Goal[] {
  if (profile.goals && profile.goals.length) return profile.goals
  return profile.goal ? [profile.goal] : []
}

function readPrefs(profile: CycleProfile): TrackPrefs {
  return (profile.trackPrefs ?? {}) as TrackPrefs
}

/** A complete, de-duplicated section order (custom order first, missing appended). */
function fullOrder(order?: SectionId[]): SectionId[] {
  const seen = new Set<SectionId>()
  const out: SectionId[] = []
  for (const id of order ?? []) {
    if (SECTION_ORDER.includes(id) && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  for (const id of SECTION_ORDER) if (!seen.has(id)) out.push(id)
  return out
}

/**
 * Split every section into what leads (featured, opens expanded) vs what waits
 * below ("more to log", collapsed). Featured = core, or user-pinned, or tied to
 * a chosen goal. Hidden sections drop off the Log surface entirely (but stay in
 * Settings and keep their history). Core sections can never be hidden.
 */
export function resolveLogLayout(profile: CycleProfile): { featured: SectionId[]; more: SectionId[] } {
  const prefs = readPrefs(profile)
  const goals = profileGoals(profile)
  const pinned = new Set(prefs.pinned ?? [])
  const hidden = new Set(prefs.hidden ?? [])
  const order = fullOrder(prefs.order)

  const featured: SectionId[] = []
  const more: SectionId[] = []
  for (const id of order) {
    const m = sectionMeta(id)
    if (hidden.has(id) && !m.core) continue
    const isFeatured = m.core || pinned.has(id) || m.goals.some((g) => goals.includes(g))
    ;(isFeatured ? featured : more).push(id)
  }
  // Pull explicitly-pinned sections to the very top, in pin order.
  const pinnedFirst = (prefs.pinned ?? []).filter((id) => featured.includes(id))
  const rest = featured.filter((id) => !pinnedFirst.includes(id))
  return { featured: [...pinnedFirst, ...rest], more }
}

// --- pure pref mutators (pages persist the result via saveProfile) -----------

export function togglePinned(prefs: TrackPrefs, id: SectionId): TrackPrefs {
  const set = new Set(prefs.pinned ?? [])
  set.has(id) ? set.delete(id) : set.add(id)
  return { ...prefs, pinned: [...set] }
}

export function toggleHidden(prefs: TrackPrefs, id: SectionId): TrackPrefs {
  const set = new Set(prefs.hidden ?? [])
  set.has(id) ? set.delete(id) : set.add(id)
  return { ...prefs, hidden: [...set] }
}

/** Move a section up/down in the user's custom order. */
export function reorder(prefs: TrackPrefs, id: SectionId, dir: -1 | 1): TrackPrefs {
  const order = fullOrder(prefs.order)
  const i = order.indexOf(id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= order.length) return prefs
  ;[order[i], order[j]] = [order[j], order[i]]
  return { ...prefs, order }
}
