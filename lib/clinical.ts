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
  if (dx) history.push(`PCOS status: ${dx}`)
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

  return { menstrual, body, history, meds, measurements, labs: profile.labs ?? [], rotterdam }
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
  return bits.join("; ")
}
