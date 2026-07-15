/**
 * Hirsutism tracking over time — from the Dr. Sood meeting.
 *
 * Two clinician-suggested signals that change slowly and matter:
 *  - Hair-removal cadence: how many days between shaving/waxing. Longer gaps
 *    over time can reflect treatment working (a concrete, low-effort proxy the
 *    Ferriman-Gallwey snapshot misses). "Mark shaving days like period days."
 *  - Dated photos of an area, to see growth/improvement across months.
 *
 * Shave dates live in localStorage. Photos reuse the PRIVATE lab-photos bucket
 * (owner-only), under each user's /{id}/hirsutism/ folder.
 */

import type { User } from "@supabase/supabase-js"
import { browserClient } from "@/lib/supabase"
import { toDateKey, type DateKey } from "@/lib/tracker"

// ---- Shave / hair-removal cadence ------------------------------------------

const SHAVES_KEY = "polaris.hirsutism.shaves.v1"

export function getShaveDays(): DateKey[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(SHAVES_KEY)
    const arr = raw ? (JSON.parse(raw) as DateKey[]) : []
    return Array.isArray(arr) ? arr.sort() : []
  } catch {
    return []
  }
}

function saveShaveDays(days: DateKey[]) {
  try {
    window.localStorage.setItem(SHAVES_KEY, JSON.stringify([...new Set(days)].sort()))
  } catch {
    /* ignore */
  }
}

export function toggleShaveDay(date: DateKey = toDateKey(new Date())): DateKey[] {
  const days = getShaveDays()
  const next = days.includes(date) ? days.filter((d) => d !== date) : [...days, date]
  saveShaveDays(next)
  return getShaveDays()
}

export function isShaveDay(date: DateKey): boolean {
  return getShaveDays().includes(date)
}

function daysBetween(a: DateKey, b: DateKey): number {
  const ms = new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()
  return Math.round(ms / 86_400_000)
}

export interface ShaveStats {
  count: number
  averageInterval: number | null // mean days between removals
  lastShave: DateKey | null
  daysSinceLast: number | null
  /** Recent intervals, oldest→newest, for a tiny trend. */
  intervals: number[]
}

export function shaveStats(): ShaveStats {
  const days = getShaveDays()
  if (days.length === 0) return { count: 0, averageInterval: null, lastShave: null, daysSinceLast: null, intervals: [] }
  const intervals: number[] = []
  for (let i = 1; i < days.length; i++) {
    const gap = daysBetween(days[i - 1], days[i])
    if (gap > 0 && gap <= 120) intervals.push(gap)
  }
  const avg = intervals.length ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : null
  const last = days[days.length - 1]
  return {
    count: days.length,
    averageInterval: avg,
    lastShave: last,
    daysSinceLast: daysBetween(last, toDateKey(new Date())),
    intervals,
  }
}

// ---- Dated photos (private, reuses the lab-photos bucket) -------------------

const BUCKET = "lab-photos"
const PHOTOS_KEY = "polaris.hirsutism.photos.v1"

export interface HirsutismPhoto {
  id: string
  path: string
  area?: string
  date: DateKey
  createdAt: number
}

export function getHirsutismPhotos(): HirsutismPhoto[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(PHOTOS_KEY)
    const arr = raw ? (JSON.parse(raw) as HirsutismPhoto[]) : []
    return Array.isArray(arr) ? arr.sort((a, b) => b.createdAt - a.createdAt) : []
  } catch {
    return []
  }
}

function savePhotos(rows: HirsutismPhoto[]) {
  try {
    window.localStorage.setItem(PHOTOS_KEY, JSON.stringify(rows))
  } catch {
    /* ignore */
  }
}

export async function uploadHirsutismPhoto(file: File, user: User, area?: string): Promise<{ photo?: HirsutismPhoto; error?: string }> {
  const c = browserClient()
  if (!c) return { error: "Not connected." }
  if (file.size > 25 * 1024 * 1024) return { error: "That image is over 25MB — try a smaller one." }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
  const path = `${user.id}/hirsutism/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await c.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { error: error.message }
  const photo: HirsutismPhoto = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    path,
    area: area?.trim() || undefined,
    date: toDateKey(new Date()),
    createdAt: Date.now(),
  }
  savePhotos([photo, ...getHirsutismPhotos()])
  return { photo }
}

export async function removeHirsutismPhoto(id: string): Promise<HirsutismPhoto[]> {
  const photos = getHirsutismPhotos()
  const target = photos.find((p) => p.id === id)
  const c = browserClient()
  if (c && target) await c.storage.from(BUCKET).remove([target.path]).catch(() => {})
  const next = photos.filter((p) => p.id !== id)
  savePhotos(next)
  return next
}
