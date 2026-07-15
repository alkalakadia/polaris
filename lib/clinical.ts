/**
 * Clinical summary builder — turns the health profile + logs into structured,
 * clinician-friendly data for the gyno PDF, and a compact context string the AI
 * uses to personalize answers.
 *
 * Everything here is DATA the patient entered. It is never a diagnosis. The
 * Rotterdam block in particular lists signals the patient logged, with an
 * explicit note that diagnosis requires a clinician.
 */

import { CHIP_GROUPS, type TrackEntry } from "@/lib/tracker"
import {
  CONTRACEPTION,
  DIAGNOSIS_OPTIONS,
  FAMILY_HISTORY,
  PREGNANCY_INTENT,
  bmi,
  labelFor,
  type CycleProfile,
  type LabResult,
} from "@/lib/profile"
import { SYMPTOM_CATEGORIES, hasSensitiveSelected, labelForItem } from "@/lib/symptom-profile"

export interface ScreeningPrompt {
  label: string
  detail: string
}

/**
 * Layer 3 — gentle "worth asking your doctor to screen for" prompts. Built from
 * the symptom profile + logged data + family history. Never says "you have X".
 */
export function buildScreening(profile: CycleProfile, entries: TrackEntry[]): {
  prompts: ScreeningPrompt[]
  sensitive: boolean
} {
  const sp = profile.symptomProfile ?? {}
  const anyIn = (cat: string, ids: string[]) => ids.some((id) => (sp[cat] ?? []).includes(id))
  const fam = new Set(profile.familyHistory ?? [])
  const prompts: ScreeningPrompt[] = []

  const w = latestNumber(entries, "weightKg")
  const b = bmi(profile.heightCm, w?.value)
  if (anyIn("insulin", ["acanthosis", "skintags", "postmeal", "shaky", "hunger", "cravings", "bellyfat"]) || fam.has("diabetes") || (b != null && b >= 30)) {
    prompts.push({
      label: "Blood sugar",
      detail: "Worth asking your doctor about screening for prediabetes or type 2 diabetes (an A1c or fasting glucose test).",
    })
  }
  const sys = latestNumber(entries, "bpSys")
  if ((sys && sys.value >= 130) || fam.has("heart")) {
    prompts.push({
      label: "Heart health",
      detail: "A blood pressure and cholesterol check could be worth bringing up at your visit.",
    })
  }
  if (anyIn("sleep", ["snoring", "daysleepy", "morningheadache"])) {
    prompts.push({
      label: "Sleep",
      detail: "Snoring or daytime sleepiness can be worth asking your doctor to screen for sleep apnea.",
    })
  }
  if (anyIn("mood", ["anxiety", "depression"])) {
    prompts.push({
      label: "Mood",
      detail: "It can really help to talk with your doctor or a therapist about how you have been feeling.",
    })
  }
  return { prompts, sensitive: hasSensitiveSelected(sp) }
}

export interface RotterdamSignal {
  label: string
  detail: string
}

export interface ClinicalSummary {
  menstrual: string[]
  body: string[]
  history: string[]
  meds: { label: string; days: number }[]
  measurements: string[]
  labs: LabResult[]
  rotterdam: RotterdamSignal[]
  symptomsByCategory: { title: string; emoji: string; items: string[] }[]
  screening: ScreeningPrompt[]
}

function fmt(d?: string): string {
  if (!d) return ""
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function latestNumber(entries: TrackEntry[], key: keyof TrackEntry): { value: number; date: string } | null {
  const withVal = entries
    .filter((e) => typeof e[key] === "number")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  if (!withVal.length) return null
  return { value: withVal[0][key] as number, date: withVal[0].date }
}

function symptomDayCount(entries: TrackEntry[], groupKey: "symptoms" | "skinHair", ids: string[]): number {
  return entries.filter((e) => {
    const v = e[groupKey] as string[] | undefined
    return v && ids.some((id) => v.includes(id))
  }).length
}

export function buildClinicalSummary(profile: CycleProfile, entries: TrackEntry[]): ClinicalSummary {
  const flowDays = entries.filter((e) => e.flow && e.flow !== "none").length
  const oldest = entries.length ? entries[entries.length - 1].date : null
  const newest = entries.length ? entries[0].date : null

  // --- menstrual history ---
  const menstrual: string[] = []
  if (profile.menarcheAge) menstrual.push(`Menarche: age ${profile.menarcheAge}`)
  if (profile.cycleLength)
    menstrual.push(`Reported cycle length: ~${profile.cycleLength} days${profile.cycleIrregular ? " (reports irregular)" : ""}`)
  if (profile.periodLength) menstrual.push(`Period length: ~${profile.periodLength} days`)
  if (profile.longestGapDays) menstrual.push(`Longest reported gap between periods: ${profile.longestGapDays} days`)
  if (profile.lastPeriodStart) menstrual.push(`Last period started: ${fmt(profile.lastPeriodStart)}`)
  if (flowDays) menstrual.push(`Period days logged in app: ${flowDays}${oldest ? ` (since ${fmt(oldest)})` : ""}`)

  // --- body / vitals ---
  const body: string[] = []
  if (profile.heightCm) body.push(`Height: ${profile.heightCm} cm`)
  const w = latestNumber(entries, "weightKg")
  if (w) {
    const b = bmi(profile.heightCm, w.value)
    body.push(`Weight: ${Math.round(w.value * 10) / 10} kg${b ? ` · BMI ${b}` : ""} (${fmt(w.date)})`)
  }
  const sys = latestNumber(entries, "bpSys")
  const dia = latestNumber(entries, "bpDia")
  if (sys && dia) body.push(`Blood pressure: ${sys.value}/${dia.value} mmHg (${fmt(sys.date)})`)

  // --- relevant history ---
  const history: string[] = []
  const dx = labelFor(DIAGNOSIS_OPTIONS, profile.diagnosis)
  if (dx) history.push(`PMOS status: ${dx}`)
  if (profile.familyHistory?.length) {
    const fh = profile.familyHistory.map((id) => labelFor(FAMILY_HISTORY, id)).filter(Boolean)
    history.push(`Family history: ${fh.join(", ")}`)
  }
  const con = labelFor(CONTRACEPTION, profile.contraception)
  if (con) history.push(`Contraception: ${con}`)
  const intent = labelFor(PREGNANCY_INTENT, profile.pregnancyIntent)
  if (intent) history.push(`Pregnancy intent: ${intent}`)

  // --- meds + adherence proxy (days logged) ---
  const medGroup = CHIP_GROUPS.find((g) => g.key === "meds")
  const medCounts = new Map<string, number>()
  for (const e of entries) for (const id of (e.meds as string[] | undefined) ?? []) medCounts.set(id, (medCounts.get(id) ?? 0) + 1)
  const meds = [...medCounts.entries()]
    .map(([id, days]) => ({ label: medGroup?.options.find((o) => o.id === id)?.label ?? id, days }))
    .sort((a, b) => b.days - a.days)

  // --- measurements / extras ---
  const measurements: string[] = []
  const bbtCount = entries.filter((e) => typeof e.bbt === "number").length
  if (bbtCount) measurements.push(`Basal temperature logged on ${bbtCount} day${bbtCount === 1 ? "" : "s"}`)
  const ovCount = entries.filter((e) => e.ovTest).length
  if (ovCount) {
    const peak = entries.filter((e) => e.ovTest === "peak").length
    measurements.push(`Ovulation tests logged: ${ovCount}${peak ? `, ${peak} peak` : ""}`)
  }

  // --- Rotterdam-RELEVANT signals (data only, never a diagnosis) ---
  const acneHair = symptomDayCount(entries, "skinHair", ["acne", "newhair", "darkpatches"])
  const rotterdam: RotterdamSignal[] = [
    {
      label: "Cycle regularity",
      detail: profile.cycleIrregular
        ? "Patient reports irregular cycles."
        : flowDays
          ? "Cycles tracked; regularity to be assessed clinically."
          : "Not enough period data logged yet.",
    },
    {
      label: "Androgen-related signs (patient-reported)",
      detail: acneHair
        ? `Logged acne / new hair / skin changes on ${acneHair} day${acneHair === 1 ? "" : "s"}.`
        : "None notably logged.",
    },
    {
      label: "Ovarian imaging",
      detail: "Not assessed in app — requires ultrasound.",
    },
  ]

  // --- symptom profile (Layer 2), grouped for the clinician ---
  const sp = profile.symptomProfile ?? {}
  const symptomsByCategory = SYMPTOM_CATEGORIES.map((cat) => ({
    title: cat.title,
    emoji: cat.emoji,
    items: (sp[cat.id] ?? []).map((id) => labelForItem(cat.id, id)).filter(Boolean) as string[],
  })).filter((c) => c.items.length > 0)

  const { prompts: screening } = buildScreening(profile, entries)

  return {
    menstrual,
    body,
    history,
    meds,
    measurements,
    labs: profile.labs ?? [],
    rotterdam,
    symptomsByCategory,
    screening,
  }
}

// ---- Pre-visit summary (Rotterdam 2-of-3, criteria-mapped) -----------------

export interface PreVisitCriterion {
  key: "cycle" | "androgen" | "morphology"
  label: string
  signal: boolean
  detail: string
}

export interface PreVisit {
  criteria: PreVisitCriterion[]
  signalCount: number
  note: string
}

export interface PreVisitInputs {
  fgTotal?: number | null
  fgCutoff?: number | null
  acneSeverity?: number | null // 0-3
  hairLossSeverity?: number | null // 0-3
  hasAndrogenLab?: boolean
  hasAMH?: boolean
}

const SEV_WORD = ["none", "mild", "moderate", "severe"]

/**
 * Maps the patient's data onto the three Rotterdam areas, for discussion with a
 * clinician. Never a diagnosis: morphology needs ultrasound, and diagnosis is
 * clinical and one of exclusion. Extra inputs (FG score, acne, labs) come from
 * the assessment/lab modules so this stays a pure function.
 */
export function buildPreVisit(profile: CycleProfile, entries: TrackEntry[], x: PreVisitInputs): PreVisit {
  const sp = (profile.symptomProfile ?? {}) as Record<string, string[]>
  const cycleSP = sp["cycle"] ?? []

  const cycleSignal =
    !!profile.cycleIrregular ||
    (profile.cycleLength != null && profile.cycleLength >= 35) ||
    (profile.longestGapDays != null && profile.longestGapDays >= 45) ||
    ["irregular", "infrequent", "missing", "long", "unpredictable"].some((id) => cycleSP.includes(id))
  const cycleDetail = cycleSignal
    ? `Irregular or infrequent cycles reported${
        profile.cycleLength ? ` (~${profile.cycleLength} days${profile.cycleIrregular ? ", reports irregular" : ""})` : ""
      }.`
    : "No clear cycle irregularity reported."

  const acneHairDays = symptomDayCount(entries, "skinHair", ["acne", "newhair", "darkpatches"])
  const fgHigh = x.fgTotal != null && x.fgCutoff != null && x.fgTotal >= x.fgCutoff
  const androgenSignal = fgHigh || (x.acneSeverity ?? 0) >= 2 || (x.hairLossSeverity ?? 0) >= 2 || acneHairDays > 0
  const androgenBits: string[] = []
  if (x.fgTotal != null) androgenBits.push(`Ferriman-Gallwey self-score ${x.fgTotal}${x.fgCutoff != null ? ` (ref ≥${x.fgCutoff})` : ""}`)
  if ((x.acneSeverity ?? 0) >= 1) androgenBits.push(`acne ${SEV_WORD[x.acneSeverity ?? 0]}`)
  if ((x.hairLossSeverity ?? 0) >= 1) androgenBits.push(`scalp hair loss ${SEV_WORD[x.hairLossSeverity ?? 0]}`)
  if (x.hasAndrogenLab) androgenBits.push("androgen labs recorded")
  const androgenDetail = androgenBits.length ? `${androgenBits.join("; ")}.` : "No notable androgen-related signs reported."

  const morphBits = ["Requires pelvic ultrasound (not assessed in app)."]
  if (x.hasAMH) morphBits.push("AMH recorded — an accepted alternative marker in the 2023 international guidelines.")
  morphBits.push("Within ~8 years of a first period, ultrasound is not used; clinicians rely on cycles and androgen signs.")

  const criteria: PreVisitCriterion[] = [
    { key: "cycle", label: "Irregular / infrequent cycles", signal: cycleSignal, detail: cycleDetail },
    { key: "androgen", label: "Signs of androgen excess", signal: androgenSignal, detail: androgenDetail },
    { key: "morphology", label: "Polycystic ovarian morphology", signal: false, detail: morphBits.join(" ") },
  ]
  const signalCount = (cycleSignal ? 1 : 0) + (androgenSignal ? 1 : 0)
  const note = `Diagnosis uses the Rotterdam criteria (2 of 3), confirmed by a clinician after ruling out other causes. This shows ${signalCount} area${
    signalCount === 1 ? "" : "s"
  } with patient-reported signals. It is for discussion, not a diagnosis.`
  return { criteria, signalCount, note }
}

/** Compact, non-identifying context string for personalizing AI answers. */
export function healthContext(profile: CycleProfile, entries: TrackEntry[]): string {
  if (!profile.completedAt) return ""
  const bits: string[] = []
  const dx = labelFor(DIAGNOSIS_OPTIONS, profile.diagnosis)
  if (dx) bits.push(dx.toLowerCase())
  if (profile.cycleLength) bits.push(`cycles ~${profile.cycleLength} days${profile.cycleIrregular ? " (irregular)" : ""}`)
  const intent = labelFor(PREGNANCY_INTENT, profile.pregnancyIntent)
  if (intent) bits.push(`pregnancy intent: ${intent.toLowerCase()}`)
  if (profile.goal) bits.push(`goal: ${profile.goal}`)
  // top logged symptoms / skin-hair
  const symCounts = new Map<string, number>()
  for (const e of entries) for (const s of [...((e.symptoms as string[]) ?? []), ...((e.skinHair as string[]) ?? [])]) symCounts.set(s, (symCounts.get(s) ?? 0) + 1)
  const top = [...symCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  if (top.length) {
    const allOpts = CHIP_GROUPS.flatMap((g) => g.options)
    const labels = top.map(([id]) => allOpts.find((o) => o.id === id)?.label?.toLowerCase()).filter(Boolean)
    if (labels.length) bits.push(`often logs ${labels.join(", ")}`)
  }
  if (profile.familyHistory?.length && !profile.familyHistory.includes("none")) {
    const fh = profile.familyHistory.map((id) => labelFor(FAMILY_HISTORY, id)?.toLowerCase()).filter(Boolean)
    if (fh.length) bits.push(`family history of ${fh.join(", ")}`)
  }
  // experienced symptoms from the profile (Layer 2)
  const sp = profile.symptomProfile ?? {}
  const spLabels: string[] = []
  for (const cat of SYMPTOM_CATEGORIES) for (const id of sp[cat.id] ?? []) {
    const l = labelForItem(cat.id, id)
    if (l) spLabels.push(l.toLowerCase())
  }
  if (spLabels.length) bits.push(`reports experiencing: ${spLabels.slice(0, 8).join(", ")}`)
  return bits.join("; ")
}
