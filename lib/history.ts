/**
 * Main concern + birth-control / medical history — from the Dr. Sood meeting.
 *
 *  - "Ask users what their main concern is" (weight, pregnancy, metabolism...).
 *    It frames the whole visit and what to prioritize.
 *  - "Have them track out their birth control, IUD, other medical history" and
 *    "remember why they started BC." Symptoms read very differently on vs off
 *    hormonal birth control, so the timeline matters clinically.
 *
 * Stored in localStorage; surfaced in the pre-visit summary for the doctor.
 */

import { type DateKey } from "@/lib/tracker"

export interface Concern {
  id: string
  label: string
  emoji: string
}

export const CONCERNS: Concern[] = [
  { id: "fertility", label: "Getting pregnant / fertility", emoji: "🤍" },
  { id: "cycles", label: "Regular, predictable periods", emoji: "🌙" },
  { id: "weight", label: "Weight & metabolism", emoji: "⚖️" },
  { id: "skin", label: "Skin & hair (acne, hair growth, hair loss)", emoji: "✨" },
  { id: "mood", label: "Mood & energy", emoji: "💗" },
  { id: "diagnosis", label: "Understanding if I have PMOS", emoji: "🔍" },
  { id: "other", label: "Something else", emoji: "🎯" },
]

export function concernLabel(id?: string): string | null {
  return CONCERNS.find((c) => c.id === id)?.label ?? null
}

export interface ContraType {
  id: string
  label: string
  hormonal: boolean
}

export const CONTRA_TYPES: ContraType[] = [
  { id: "combined", label: "Combined pill (estrogen + progestin)", hormonal: true },
  { id: "minipill", label: "Progestin-only pill (mini-pill)", hormonal: true },
  { id: "hormonalIUD", label: "Hormonal IUD (Mirena, Kyleena…)", hormonal: true },
  { id: "copperIUD", label: "Copper IUD (Paragard)", hormonal: false },
  { id: "implant", label: "Implant (Nexplanon)", hormonal: true },
  { id: "shot", label: "Shot (Depo-Provera)", hormonal: true },
  { id: "patch", label: "Patch", hormonal: true },
  { id: "ring", label: "Ring (NuvaRing)", hormonal: true },
  { id: "none", label: "None / natural", hormonal: false },
  { id: "other", label: "Other", hormonal: false },
]

export function contraLabel(id: string): string {
  return CONTRA_TYPES.find((t) => t.id === id)?.label ?? id
}

export interface ContraEntry {
  id: string
  type: string
  startDate?: DateKey
  endDate?: DateKey
  current: boolean
  reason?: string // why they started
  note?: string // symptoms on it, etc.
  createdAt: number
}

export interface HistoryData {
  mainConcern?: { id: string; note?: string }
  contraception: ContraEntry[]
}

const KEY = "polaris.history.v1"

export function getHistory(): HistoryData {
  if (typeof window === "undefined") return { contraception: [] }
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as HistoryData) : null
    return parsed && Array.isArray(parsed.contraception) ? parsed : { contraception: [] }
  } catch {
    return { contraception: [] }
  }
}

function save(h: HistoryData) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(h))
  } catch {
    /* ignore */
  }
}

export function setMainConcern(id: string, note?: string): HistoryData {
  const h = getHistory()
  h.mainConcern = { id, note: note?.trim() || undefined }
  save(h)
  return getHistory()
}

export function addContra(input: Omit<ContraEntry, "id" | "createdAt">): HistoryData {
  const h = getHistory()
  const entry: ContraEntry = {
    ...input,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  }
  // newest first
  h.contraception = [entry, ...h.contraception]
  save(h)
  return getHistory()
}

export function removeContra(id: string): HistoryData {
  const h = getHistory()
  h.contraception = h.contraception.filter((c) => c.id !== id)
  save(h)
  return getHistory()
}

/** One-line description of an entry for the summary. */
export function contraSummary(c: ContraEntry): string {
  const span = c.current
    ? `${c.startDate ?? "?"} → now`
    : c.startDate || c.endDate
      ? `${c.startDate ?? "?"} → ${c.endDate ?? "?"}`
      : ""
  const bits = [contraLabel(c.type)]
  if (span) bits.push(`(${span})`)
  if (c.reason) bits.push(`— for ${c.reason}`)
  return bits.join(" ")
}
