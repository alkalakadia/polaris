/**
 * Clinical self-assessments — standardized, evidence-based instruments the
 * multi-disciplinary PMOS clinics actually use (per Dr. Sood). Patient-facing,
 * self-scored, never diagnostic. Results feed the pre-visit summary so the
 * clinician can see them at a glance.
 *
 *  - Ferriman-Gallwey (mFG): hirsutism self-score, 9 body areas, 0-4 each.
 *    Cutoffs vary by ethnicity (Dr. Sood stressed cultural sensitivity), so we
 *    show a culturally-aware reference range, never a hard "abnormal" label.
 *  - Acne + scalp hair-loss severity: the other hyperandrogenism signs.
 *  - GAD-7 (anxiety), PHQ-9 (depression), STOP-BANG (sleep apnea risk).
 *
 * PHQ-9 item 9 (thoughts of self-harm) is sensitive: any positive answer
 * surfaces a supportive resource, never a silent score.
 *
 * Stored in localStorage (consistent with profile/goals); swap for Supabase
 * later without touching the UI.
 */

export type AssessmentId = "fg" | "acne" | "hairloss" | "gad7" | "phq9" | "stopbang"

// ---- Ferriman-Gallwey (hirsutism) -----------------------------------------

export const FG_AREAS: { id: string; label: string }[] = [
  { id: "lip", label: "Upper lip" },
  { id: "chin", label: "Chin" },
  { id: "chest", label: "Chest" },
  { id: "upperBack", label: "Upper back" },
  { id: "lowerBack", label: "Lower back" },
  { id: "upperAbdomen", label: "Upper abdomen" },
  { id: "lowerAbdomen", label: "Lower abdomen" },
  { id: "upperArms", label: "Upper arms" },
  { id: "thighs", label: "Thighs" },
]

/** 0-4 terminal-hair scale, in plain language. */
export const FG_LEVELS: { value: 0 | 1 | 2 | 3 | 4; label: string }[] = [
  { value: 0, label: "None" },
  { value: 1, label: "A few hairs" },
  { value: 2, label: "Some / scattered" },
  { value: 3, label: "Quite a bit" },
  { value: 4, label: "A lot / dense" },
]

/** Cultural-context reference ranges for the total mFG score (non-diagnostic). */
export const FG_ETHNICITY: { id: string; label: string; cutoff: number }[] = [
  { id: "general", label: "Prefer not to say / general", cutoff: 8 },
  { id: "white", label: "White / European", cutoff: 8 },
  { id: "black", label: "Black / African", cutoff: 8 },
  { id: "hispanic", label: "Hispanic / Latina", cutoff: 8 },
  { id: "middleeast", label: "Middle Eastern / Mediterranean", cutoff: 9 },
  { id: "southasian", label: "South Asian", cutoff: 9 },
  { id: "eastasian", label: "East / Southeast Asian", cutoff: 6 },
]

export function fgTotal(byArea: Record<string, number>): number {
  return FG_AREAS.reduce((sum, a) => sum + (byArea[a.id] ?? 0), 0)
}

export function fgCutoff(ethnicityId: string): number {
  return FG_ETHNICITY.find((e) => e.id === ethnicityId)?.cutoff ?? 8
}

// ---- Simple severity scales (acne, hair loss) ------------------------------

export const SEVERITY_4: { value: number; label: string }[] = [
  { value: 0, label: "None" },
  { value: 1, label: "Mild" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "Severe" },
]

// ---- Questionnaire-based screeners -----------------------------------------

export interface Screener {
  id: AssessmentId
  name: string
  emoji: string
  intro: string
  /** Lead-in shown above the items. */
  prompt: string
  options: { label: string; value: number }[]
  items: string[]
  /** Index of a sensitive item (e.g. self-harm) that triggers a support note. */
  sensitiveIndex?: number
  bands: { max: number; label: string }[]
}

const FREQ_0_3 = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
]

export const GAD7: Screener = {
  id: "gad7",
  name: "Anxiety check (GAD-7)",
  emoji: "🌧️",
  intro: "A quick, standard anxiety screen. Not a diagnosis.",
  prompt: "Over the last 2 weeks, how often have you been bothered by...",
  options: FREQ_0_3,
  items: [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it's hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen",
  ],
  bands: [
    { max: 4, label: "Minimal" },
    { max: 9, label: "Mild" },
    { max: 14, label: "Moderate" },
    { max: 21, label: "Severe" },
  ],
}

export const PHQ9: Screener = {
  id: "phq9",
  name: "Mood check (PHQ-9)",
  emoji: "💧",
  intro: "A quick, standard depression screen. Not a diagnosis.",
  prompt: "Over the last 2 weeks, how often have you been bothered by...",
  options: FREQ_0_3,
  items: [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling/staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself, or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading or watching TV",
    "Moving or speaking so slowly that others could notice, or being so fidgety/restless that you move around a lot more than usual",
    "Thoughts that you would be better off dead, or of hurting yourself in some way",
  ],
  sensitiveIndex: 8,
  bands: [
    { max: 4, label: "Minimal" },
    { max: 9, label: "Mild" },
    { max: 14, label: "Moderate" },
    { max: 19, label: "Moderately severe" },
    { max: 27, label: "Severe" },
  ],
}

const YES_NO = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
]

export const STOPBANG: Screener = {
  id: "stopbang",
  name: "Sleep apnea risk (STOP-BANG)",
  emoji: "😴",
  intro: "PMOS raises sleep-apnea risk. A quick yes/no screen, not a diagnosis.",
  prompt: "Answer yes or no:",
  options: YES_NO,
  items: [
    "Do you snore loudly (louder than talking, or heard through a closed door)?",
    "Do you often feel tired, fatigued, or sleepy during the daytime?",
    "Has anyone observed you stop breathing, choke, or gasp during sleep?",
    "Do you have, or are you treated for, high blood pressure?",
    "Is your BMI over 35?",
    "Are you over 50 years old?",
    "Is your neck circumference large (over 16 in / 40 cm)?",
    "Were you assigned male at birth?",
  ],
  bands: [
    { max: 2, label: "Low risk" },
    { max: 4, label: "Intermediate risk" },
    { max: 8, label: "High risk" },
  ],
}

export const SCREENERS: Screener[] = [GAD7, PHQ9, STOPBANG]

export function screenerById(id: AssessmentId): Screener | undefined {
  return SCREENERS.find((s) => s.id === id)
}

export function bandFor(s: Screener, score: number): string {
  return s.bands.find((b) => score <= b.max)?.label ?? s.bands[s.bands.length - 1].label
}

// ---- Storage ---------------------------------------------------------------

export interface AssessmentResult {
  id: AssessmentId
  score: number
  band?: string
  detail?: Record<string, number> // FG by-area, or screener per-item answers
  meta?: Record<string, string> // e.g. FG ethnicity
  updatedAt: number
}

const KEY = "polaris.assessments.v1"

export function getAllResults(): Partial<Record<AssessmentId, AssessmentResult>> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<Record<AssessmentId, AssessmentResult>>) : {}
  } catch {
    return {}
  }
}

export function getResult(id: AssessmentId): AssessmentResult | undefined {
  return getAllResults()[id]
}

export function saveResult(r: Omit<AssessmentResult, "updatedAt">): AssessmentResult {
  const all = getAllResults()
  const full: AssessmentResult = { ...r, updatedAt: Date.now() }
  all[r.id] = full
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* ignore quota */
  }
  return full
}
