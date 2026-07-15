/**
 * Lab results — the bloodwork that PMOS care and the Rotterdam criteria turn on
 * (AMH, androgens, metabolic, lipids, thyroid). Manual entry (you copy values
 * off your own report, which carries its own lab-specific reference range), plus
 * an optional photo of the report stored privately.
 *
 * We deliberately DON'T hardcode "normal" thresholds: reference ranges vary by
 * assay, units, and lab, and Dr. Sood stressed accuracy over guesses. We show
 * what each test is for, not a verdict. Values flow into the pre-visit summary.
 *
 * Values live in localStorage; photos go to a PRIVATE Supabase bucket
 * (owner-only), so report images never become public.
 */

import type { User } from "@supabase/supabase-js"
import { browserClient } from "@/lib/supabase"
import { toDateKey, type DateKey } from "@/lib/tracker"

export interface LabDef {
  id: string
  label: string
  unit: string
  about: string
}

export interface LabGroup {
  id: string
  title: string
  emoji: string
  labs: LabDef[]
}

export const LAB_GROUPS: LabGroup[] = [
  {
    id: "androgens",
    title: "Androgens",
    emoji: "🧬",
    labs: [
      { id: "totalT", label: "Total testosterone", unit: "ng/dL", about: "Main androgen; often raised in PMOS" },
      { id: "freeT", label: "Free testosterone", unit: "pg/mL", about: "The active fraction of testosterone" },
      { id: "shbg", label: "SHBG", unit: "nmol/L", about: "Binds testosterone; often low in PMOS" },
      { id: "dheas", label: "DHEA-S", unit: "µg/dL", about: "Adrenal androgen; helps rule out other causes" },
      { id: "androstenedione", label: "Androstenedione", unit: "ng/dL", about: "Another androgen sometimes checked" },
    ],
  },
  {
    id: "reproductive",
    title: "Ovarian & reproductive",
    emoji: "🌙",
    labs: [
      { id: "amh", label: "AMH", unit: "ng/mL", about: "Marker of follicle numbers; rising as a PMOS marker" },
      { id: "lh", label: "LH", unit: "mIU/mL", about: "Pituitary hormone; LH:FSH ratio is often elevated" },
      { id: "fsh", label: "FSH", unit: "mIU/mL", about: "Pituitary hormone; paired with LH" },
      { id: "estradiol", label: "Estradiol (E2)", unit: "pg/mL", about: "Main estrogen" },
      { id: "prolactin", label: "Prolactin", unit: "ng/mL", about: "Checked to rule out other causes of irregular cycles" },
    ],
  },
  {
    id: "metabolic",
    title: "Metabolic",
    emoji: "🍞",
    labs: [
      { id: "glucose", label: "Fasting glucose", unit: "mg/dL", about: "Blood sugar after fasting" },
      { id: "insulin", label: "Fasting insulin", unit: "µIU/mL", about: "Insulin resistance is common in PMOS" },
      { id: "hba1c", label: "HbA1c", unit: "%", about: "Average blood sugar over ~3 months" },
      { id: "ogtt", label: "OGTT (2-hr glucose)", unit: "mg/dL", about: "Glucose 2 hours after a sugar drink" },
    ],
  },
  {
    id: "lipids",
    title: "Lipids",
    emoji: "🫀",
    labs: [
      { id: "chol", label: "Total cholesterol", unit: "mg/dL", about: "Part of the metabolic picture" },
      { id: "ldl", label: "LDL", unit: "mg/dL", about: "“Bad” cholesterol" },
      { id: "hdl", label: "HDL", unit: "mg/dL", about: "“Good” cholesterol" },
      { id: "trig", label: "Triglycerides", unit: "mg/dL", about: "Blood fats; often tracked in PMOS" },
    ],
  },
  {
    id: "other",
    title: "Thyroid & other",
    emoji: "🦋",
    labs: [
      { id: "tsh", label: "TSH", unit: "mIU/L", about: "Thyroid screen; ruled out before diagnosis" },
      { id: "ft4", label: "Free T4", unit: "ng/dL", about: "Thyroid hormone" },
      { id: "vitd", label: "Vitamin D", unit: "ng/mL", about: "Often low; affects mood and metabolism" },
    ],
  },
]

export function labDef(id: string): LabDef | undefined {
  for (const g of LAB_GROUPS) {
    const l = g.labs.find((x) => x.id === id)
    if (l) return l
  }
  return undefined
}

// ---- Values (localStorage) -------------------------------------------------

export interface LabEntry {
  id: string
  labId: string
  value: string // string so "<0.1" / ranges are allowed
  unit: string
  date: DateKey
  note?: string
  createdAt: number
}

const VALUES_KEY = "polaris.labs.v1"

export function getLabs(): LabEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(VALUES_KEY)
    const arr = raw ? (JSON.parse(raw) as LabEntry[]) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveLabs(rows: LabEntry[]) {
  try {
    window.localStorage.setItem(VALUES_KEY, JSON.stringify(rows))
  } catch {
    /* ignore quota */
  }
}

export function addLab(input: { labId: string; value: string; unit: string; date?: DateKey; note?: string }): {
  entry?: LabEntry
  error?: string
} {
  if (!input.value.trim()) return { error: "Enter a value." }
  const entry: LabEntry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    labId: input.labId,
    value: input.value.trim(),
    unit: input.unit,
    date: input.date || toDateKey(new Date()),
    note: input.note?.trim() || undefined,
    createdAt: Date.now(),
  }
  saveLabs([entry, ...getLabs()])
  return { entry }
}

export function removeLab(id: string): LabEntry[] {
  const next = getLabs().filter((l) => l.id !== id)
  saveLabs(next)
  return next
}

// ---- Report photos (private Supabase bucket) -------------------------------

export interface LabPhoto {
  id: string
  path: string
  label?: string
  date: DateKey
  createdAt: number
}

const PHOTOS_KEY = "polaris.labphotos.v1"
const BUCKET = "lab-photos"

export function getLabPhotos(): LabPhoto[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(PHOTOS_KEY)
    const arr = raw ? (JSON.parse(raw) as LabPhoto[]) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function savePhotos(rows: LabPhoto[]) {
  try {
    window.localStorage.setItem(PHOTOS_KEY, JSON.stringify(rows))
  } catch {
    /* ignore */
  }
}

/** Upload a lab-report photo to the user's private folder. Requires sign-in. */
export async function uploadLabPhoto(file: File, user: User, label?: string): Promise<{ photo?: LabPhoto; error?: string }> {
  const c = browserClient()
  if (!c) return { error: "Not connected." }
  if (file.size > 25 * 1024 * 1024) return { error: "That image is over 25MB — try a smaller one." }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await c.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { error: error.message }
  const photo: LabPhoto = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    path,
    label: label?.trim() || undefined,
    date: toDateKey(new Date()),
    createdAt: Date.now(),
  }
  savePhotos([photo, ...getLabPhotos()])
  return { photo }
}

export async function removeLabPhoto(id: string): Promise<LabPhoto[]> {
  const photos = getLabPhotos()
  const target = photos.find((p) => p.id === id)
  const c = browserClient()
  if (c && target) await c.storage.from(BUCKET).remove([target.path]).catch(() => {})
  const next = photos.filter((p) => p.id !== id)
  savePhotos(next)
  return next
}

/** Short-lived signed URL to view a private photo. */
export async function signedUrlFor(path: string): Promise<string | null> {
  const c = browserClient()
  if (!c) return null
  const { data } = await c.storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}
