/**
 * End-to-end verification of the patient cloud layer against the real Supabase
 * project: profile auto-creation, tracker upsert/read, and (critically) RLS
 * isolation between users. Creates two throwaway confirmed users and deletes
 * them at the end.
 */
import { readFileSync } from "node:fs"
import ws from "ws"
// Node < 22 has no global WebSocket; supabase-js realtime init needs one.
globalThis.WebSocket = globalThis.WebSocket ?? ws
import { createClient } from "@supabase/supabase-js"

// --- load .env.local --------------------------------------------------------
const env = {}
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}
env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
env.SUPABASE_SERVICE_ROLE_KEY ||= env.SUPABASE_SECRET_KEY
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m) } else { fail++; console.log("  ✗ FAIL:", m) } }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
const ts = Date.now()
const userA = { email: `polaris.test.a.${ts}@gmail.com`, password: "Test-pw-12345!" }
const userB = { email: `polaris.test.b.${ts}@gmail.com`, password: "Test-pw-12345!" }
let idA, idB

try {
  console.log("\n[1] Create two confirmed users (admin)")
  const a = await admin.auth.admin.createUser({ ...userA, email_confirm: true, user_metadata: { display_name: "Tester A" } })
  const b = await admin.auth.admin.createUser({ ...userB, email_confirm: true })
  idA = a.data.user?.id; idB = b.data.user?.id
  ok(!!idA && !!idB, "both users created")

  console.log("\n[2] Signup trigger auto-created profiles")
  const { data: profA } = await admin.from("profiles").select("id, display_name").eq("id", idA).maybeSingle()
  ok(!!profA, "profile row exists for user A")
  ok(profA?.display_name === "Tester A", "display_name carried from signup metadata")

  console.log("\n[3] User A: upsert + read own tracker entry (RLS allows owner)")
  const anonA = createClient(URL, ANON, { auth: { persistSession: false } })
  await anonA.auth.signInWithPassword(userA)
  const today = new Date().toISOString().slice(0, 10)
  const entry = { date: today, flow: "medium", moods: ["happy"], symptoms: ["cramps"], updatedAt: ts }
  const up = await anonA.from("tracker_entries").upsert(
    { user_id: idA, entry_date: today, data: entry, updated_at: new Date(ts).toISOString() },
    { onConflict: "user_id,entry_date" }
  )
  ok(!up.error, `owner can write entry ${up.error ? "(" + up.error.message + ")" : ""}`)
  const readA = await anonA.from("tracker_entries").select("entry_date, data").eq("user_id", idA)
  ok(!readA.error && readA.data?.length === 1, "owner reads back exactly 1 entry")
  ok(readA.data?.[0]?.data?.flow === "medium", "entry data round-trips correctly")

  console.log("\n[4] RLS isolation: User B cannot see User A's data")
  const anonB = createClient(URL, ANON, { auth: { persistSession: false } })
  await anonB.auth.signInWithPassword(userB)
  const cross = await anonB.from("tracker_entries").select("*").eq("user_id", idA)
  ok((cross.data?.length ?? 0) === 0, "user B sees 0 of user A's rows (RLS enforced)")
  // B writing a row for A's user_id must be rejected by the insert policy.
  const evil = await anonB.from("tracker_entries").upsert(
    { user_id: idA, entry_date: today, data: { hacked: true }, updated_at: new Date().toISOString() },
    { onConflict: "user_id,entry_date" }
  )
  ok(!!evil.error, "user B cannot write a row under user A's id (RLS blocks)")

  console.log("\n[5] User B sees only their own data")
  await anonB.from("tracker_entries").upsert(
    { user_id: idB, entry_date: today, data: { date: today, flow: "light" }, updated_at: new Date().toISOString() },
    { onConflict: "user_id,entry_date" }
  )
  const ownB = await anonB.from("tracker_entries").select("*")
  ok(ownB.data?.length === 1 && ownB.data[0].user_id === idB, "user B reads only their own 1 row")
} catch (e) {
  fail++; console.log("  ✗ EXCEPTION:", e.message)
} finally {
  console.log("\n[cleanup] delete throwaway users")
  if (idA) await admin.auth.admin.deleteUser(idA)
  if (idB) await admin.auth.admin.deleteUser(idB)
  const left = await admin.from("tracker_entries").select("user_id").in("user_id", [idA, idB].filter(Boolean))
  ok((left.data?.length ?? 0) === 0, "user deletion cascaded — no orphan tracker rows")
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`)
process.exit(fail > 0 ? 1 : 0)
