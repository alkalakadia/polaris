/**
 * Dual-mode tracker store.
 *
 * The tracker works in two modes, transparently:
 *
 *   - Signed out (or Supabase not configured): localStorage on this device.
 *     Instant, offline, zero-friction — the prototype default.
 *   - Signed in: Supabase `tracker_entries` (RLS-scoped to the user) so data
 *     syncs across devices. We still write localStorage first for instant UI
 *     and offline resilience, then upsert to the cloud.
 *
 * On first sign-in we migrate any on-device entries up to the cloud, so a user
 * who tracked before making an account doesn't lose anything.
 */

import { browserClient } from "@/lib/supabase"
import {
  getAllEntries as lsGetAll,
  getEntry as lsGet,
  saveEntry as lsSave,
  type DateKey,
  type TrackEntry,
} from "@/lib/tracker"

export type SyncMode = "cloud" | "local"

async function userId(): Promise<string | null> {
  const c = browserClient()
  if (!c) return null
  try {
    const { data } = await c.auth.getUser()
    return data.user?.id ?? null
  } catch {
    return null
  }
}

/** Whether the current session is syncing to the cloud. */
export async function syncMode(): Promise<SyncMode> {
  return (await userId()) ? "cloud" : "local"
}

/** All entries, newest-first. Cloud when signed in, else localStorage. */
export async function getAllEntriesAsync(): Promise<TrackEntry[]> {
  const c = browserClient()
  const uid = await userId()
  if (c && uid) {
    const { data, error } = await c
      .from("tracker_entries")
      .select("entry_date, data")
      .eq("user_id", uid)
      .order("entry_date", { ascending: false })
    if (!error && data) {
      return data.map((row) => ({
        ...((row.data as TrackEntry) ?? {}),
        date: row.entry_date as DateKey,
      }))
    }
    // Cloud read failed (offline, transient) — fall back to local cache.
  }
  return lsGetAll()
}

/** A single day's entry. */
export async function getEntryAsync(date: DateKey): Promise<TrackEntry> {
  const c = browserClient()
  const uid = await userId()
  if (c && uid) {
    const { data, error } = await c
      .from("tracker_entries")
      .select("data")
      .eq("user_id", uid)
      .eq("entry_date", date)
      .maybeSingle()
    if (!error && data?.data) {
      return { ...(data.data as TrackEntry), date }
    }
    if (!error) return { date } // no cloud row yet
  }
  return lsGet(date)
}

/**
 * Save an entry. Always writes localStorage synchronously (instant + offline),
 * then upserts to the cloud when signed in. Safe to call without awaiting.
 */
export async function saveEntryAsync(entry: TrackEntry): Promise<void> {
  lsSave(entry) // instant local write
  const c = browserClient()
  const uid = await userId()
  if (c && uid) {
    const { error } = await c.from("tracker_entries").upsert(
      {
        user_id: uid,
        entry_date: entry.date,
        data: { ...entry, updatedAt: Date.now() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entry_date" }
    )
    if (error) console.error("saveEntryAsync cloud upsert failed:", error.message)
  }
}

/**
 * Push any on-device entries to the cloud after sign-in. Last-write-wins by
 * `updatedAt`: a local entry only overwrites the cloud if it's newer (or the
 * cloud has nothing for that day). Runs once per session.
 */
let migrated = false
export async function migrateLocalToCloud(): Promise<void> {
  if (migrated) return
  const c = browserClient()
  const uid = await userId()
  if (!c || !uid) return

  const local = lsGetAll()
  if (local.length === 0) {
    migrated = true
    return
  }

  const { data: cloudRows } = await c
    .from("tracker_entries")
    .select("entry_date, data")
    .eq("user_id", uid)

  const cloudByDate = new Map<string, number>()
  for (const row of cloudRows ?? []) {
    const ts = ((row.data as TrackEntry)?.updatedAt as number) ?? 0
    cloudByDate.set(row.entry_date as string, ts)
  }

  const toUpsert = local
    .filter((e) => (e.updatedAt ?? 0) > (cloudByDate.get(e.date) ?? -1))
    .map((e) => ({
      user_id: uid,
      entry_date: e.date,
      data: e,
      updated_at: new Date(e.updatedAt ?? Date.now()).toISOString(),
    }))

  if (toUpsert.length > 0) {
    const { error } = await c
      .from("tracker_entries")
      .upsert(toUpsert, { onConflict: "user_id,entry_date" })
    if (error) {
      console.error("migrateLocalToCloud failed:", error.message)
      return
    }
  }
  migrated = true
}

/** Reset the once-per-session migration guard (call on sign-out). */
export function resetMigrationGuard(): void {
  migrated = false
}
