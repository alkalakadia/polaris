/**
 * Bring outside health data in — without a native app.
 *
 * A web app / PWA can't read Apple Health or Google Fit live (that needs a
 * native iOS/Android app). What it CAN do is let you upload a file you export
 * yourself and parse it. We support:
 *   - Apple Health "export.xml" (Health app → profile → Export All Health Data)
 *   - a simple CSV (date + any of steps, weightKg, restingHr, sleepHours, kcal,
 *     activeMin) that fitness apps / shortcuts can produce.
 *
 * Parsed days are merged into the tracker, only filling the metric fields, so
 * nothing you logged by hand is overwritten.
 */

import { toDateKey, type DateKey, type TrackEntry } from "@/lib/tracker"
import { getEntryAsync, saveEntryAsync } from "@/lib/tracker-store"

export type Metric = "steps" | "weightKg" | "restingHr" | "sleepHours" | "kcal" | "activeMin"
export type DayMetrics = Partial<Record<Metric, number>>
export type ParsedDays = Record<DateKey, DayMetrics>

/** Cap how far back we import so a huge export doesn't write thousands of rows. */
const MAX_DAYS = 180

function dateKeyFromAppleDate(s: string): DateKey | null {
  // Apple dates look like "2026-06-01 08:30:00 -0500"
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

interface Acc {
  sum?: number
  last?: number
  lastAt?: string
}

/** Parse an Apple Health export.xml string into per-day metrics (best effort). */
export function parseAppleHealth(xml: string): ParsedDays {
  const steps = new Map<DateKey, Acc>()
  const exercise = new Map<DateKey, Acc>()
  const energy = new Map<DateKey, Acc>()
  const weight = new Map<DateKey, Acc>()
  const hr = new Map<DateKey, Acc>()
  const sleep = new Map<DateKey, number>() // ms asleep

  const recordRe =
    /<Record[^>]*\btype="(HK[^"]+)"[^>]*\bunit="([^"]*)"[^>]*\bstartDate="([^"]+)"[^>]*\bendDate="([^"]+)"[^>]*\bvalue="([^"]*)"[^>]*\/?>/g
  let r: RegExpExecArray | null
  let count = 0
  while ((r = recordRe.exec(xml)) !== null) {
    if (++count > 2_000_000) break // hard safety stop
    const [, type, unit, startDate, , valueStr] = r
    const day = dateKeyFromAppleDate(startDate)
    if (!day) continue
    const value = parseFloat(valueStr)
    if (!Number.isFinite(value)) continue
    switch (type) {
      case "HKQuantityTypeIdentifierStepCount": {
        const a = steps.get(day) ?? {}
        a.sum = (a.sum ?? 0) + value
        steps.set(day, a)
        break
      }
      case "HKQuantityTypeIdentifierAppleExerciseTime": {
        const a = exercise.get(day) ?? {}
        a.sum = (a.sum ?? 0) + value
        exercise.set(day, a)
        break
      }
      case "HKQuantityTypeIdentifierDietaryEnergyConsumed": {
        const a = energy.get(day) ?? {}
        const kcal = /kJ/i.test(unit) ? value / 4.184 : value
        a.sum = (a.sum ?? 0) + kcal
        energy.set(day, a)
        break
      }
      case "HKQuantityTypeIdentifierBodyMass": {
        const kg = /lb/i.test(unit) ? value * 0.453592 : value
        const a = weight.get(day) ?? {}
        if (!a.lastAt || startDate > a.lastAt) {
          a.last = kg
          a.lastAt = startDate
        }
        weight.set(day, a)
        break
      }
      case "HKQuantityTypeIdentifierRestingHeartRate": {
        const a = hr.get(day) ?? {}
        if (!a.lastAt || startDate > a.lastAt) {
          a.last = value
          a.lastAt = startDate
        }
        hr.set(day, a)
        break
      }
    }
  }

  // Sleep is a category record; aggregate asleep durations per night.
  const sleepRe =
    /<Record[^>]*\btype="HKCategoryTypeIdentifierSleepAnalysis"[^>]*\bstartDate="([^"]+)"[^>]*\bendDate="([^"]+)"[^>]*\bvalue="([^"]*)"[^>]*\/?>/g
  let s: RegExpExecArray | null
  while ((s = sleepRe.exec(xml)) !== null) {
    const [, startDate, endDate, value] = s
    if (!/Asleep/i.test(value)) continue // skip "InBed"/"Awake"
    const day = dateKeyFromAppleDate(startDate)
    if (!day) continue
    const toMs = (d: string) => new Date(d.slice(0, 19).replace(" ", "T")).getTime()
    const ms = toMs(endDate) - toMs(startDate)
    if (Number.isFinite(ms) && ms > 0) sleep.set(day, (sleep.get(day) ?? 0) + ms)
  }

  const out: ParsedDays = {}
  const put = (day: DateKey, m: Metric, v: number) => {
    out[day] = out[day] ?? {}
    out[day][m] = v
  }
  for (const [d, a] of steps) if (a.sum != null) put(d, "steps", Math.round(a.sum))
  for (const [d, a] of exercise) if (a.sum != null) put(d, "activeMin", Math.round(a.sum))
  for (const [d, a] of energy) if (a.sum != null) put(d, "kcal", Math.round(a.sum))
  for (const [d, a] of weight) if (a.last != null) put(d, "weightKg", Math.round(a.last * 10) / 10)
  for (const [d, a] of hr) if (a.last != null) put(d, "restingHr", Math.round(a.last))
  for (const [d, ms] of sleep) put(d, "sleepHours", Math.round((ms / 3_600_000) * 10) / 10)
  return out
}

const CSV_ALIASES: Record<string, Metric> = {
  steps: "steps",
  step: "steps",
  stepcount: "steps",
  weight: "weightKg",
  weightkg: "weightKg",
  kg: "weightKg",
  restinghr: "restingHr",
  restingheartrate: "restingHr",
  rhr: "restingHr",
  sleep: "sleepHours",
  sleephours: "sleepHours",
  sleephrs: "sleepHours",
  kcal: "kcal",
  calories: "kcal",
  energy: "kcal",
  activemin: "activeMin",
  activeminutes: "activeMin",
  exercise: "activeMin",
}

/** Parse a simple CSV with a `date` column + any recognized metric columns. */
export function parseCsv(text: string): ParsedDays {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return {}
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[\s_-]/g, ""))
  const dateIdx = headers.findIndex((h) => h === "date" || h === "day")
  if (dateIdx < 0) return {}
  const out: ParsedDays = {}
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",")
    const rawDate = (cols[dateIdx] ?? "").trim()
    const day = rawDate.match(/\d{4}-\d{2}-\d{2}/)?.[0]
    if (!day) continue
    for (let c = 0; c < headers.length; c++) {
      if (c === dateIdx) continue
      const metric = CSV_ALIASES[headers[c]]
      if (!metric) continue
      const v = parseFloat((cols[c] ?? "").trim())
      if (!Number.isFinite(v)) continue
      out[day] = out[day] ?? {}
      out[day][metric] = v
    }
  }
  return out
}

/** Merge parsed days into the tracker, only filling metric fields. */
export async function mergeIntoTracker(days: ParsedDays): Promise<{ imported: number; fields: number }> {
  const keys = Object.keys(days).sort().reverse().slice(0, MAX_DAYS)
  let imported = 0
  let fields = 0
  for (const day of keys) {
    const m = days[day]
    const existing = await getEntryAsync(day)
    const next: TrackEntry = { ...existing, date: day }
    let changed = false
    for (const [k, v] of Object.entries(m) as [Metric, number][]) {
      if (v == null) continue
      ;(next as unknown as Record<string, unknown>)[k] = v
      fields++
      changed = true
    }
    if (changed) {
      await saveEntryAsync(next)
      imported++
    }
  }
  return { imported, fields }
}

/** Quick manual entry of today's activity/body metrics. */
export async function saveTodayMetrics(m: DayMetrics): Promise<void> {
  const day = toDateKey(new Date())
  const existing = await getEntryAsync(day)
  const next: TrackEntry = { ...existing, date: day }
  for (const [k, v] of Object.entries(m) as [Metric, number][]) {
    if (v != null && Number.isFinite(v)) (next as unknown as Record<string, unknown>)[k] = v
  }
  await saveEntryAsync(next)
}
