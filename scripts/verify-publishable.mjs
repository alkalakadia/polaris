/**
 * Consumer-flow verification using ONLY the publishable key (no admin / secret).
 * Real sign-ups (email confirmation must be OFF) exercise auth, RLS, tracker
 * CRUD, and community writes — proving the patient app works without the secret
 * key. Note: cannot delete the throwaway users without the secret key.
 */
import { readFileSync } from "node:fs"
import ws from "ws"
globalThis.WebSocket = globalThis.WebSocket ?? ws
import { createClient } from "@supabase/supabase-js"

const env = {}
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const PK = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m) } else { fail++; console.log("  ✗ FAIL:", m) } }
const ts = Date.now()
const today = new Date().toISOString().slice(0, 10)

const A = createClient(URL, PK, { auth: { persistSession: false } })
const B = createClient(URL, PK, { auth: { persistSession: false } })

try {
  console.log("\n[1] Real sign-up returns a session (email confirmation off)")
  const a = await A.auth.signUp({ email: `pl.pk.a.${ts}@gmail.com`, password: "Test-pw-12345!", options: { data: { display_name: "PK Tester A" } } })
  ok(!a.error && !!a.data.session, `user A signed up + session ${a.error ? "(" + a.error.message + ")" : ""}`)
  const uidA = a.data.user?.id

  console.log("\n[2] Signup trigger created a profile")
  const prof = await A.from("profiles").select("display_name").eq("id", uidA).maybeSingle()
  ok(prof.data?.display_name === "PK Tester A", "profile auto-created with display name")

  console.log("\n[3] Tracker: owner write + read (RLS allows owner)")
  const up = await A.from("tracker_entries").upsert(
    { user_id: uidA, entry_date: today, data: { date: today, flow: "medium", moods: ["happy"], updatedAt: ts } },
    { onConflict: "user_id,entry_date" }
  )
  ok(!up.error, `owner can write tracker entry ${up.error ? "(" + up.error.message + ")" : ""}`)
  const readA = await A.from("tracker_entries").select("data").eq("user_id", uidA)
  ok(readA.data?.length === 1 && readA.data[0].data.flow === "medium", "owner reads back their entry")

  console.log("\n[4] Community: public read + owned write")
  const seeded = await A.from("posts").select("id").limit(1)
  ok((seeded.data?.length ?? 0) >= 1, "seeded posts are publicly readable")
  const post = await A.from("posts").insert({ user_id: uidA, author_name: "pktester", sub: "wins", title: `pk post ${ts}`, body: "hi" }).select("id").single()
  ok(!post.error && !!post.data?.id, "user can create a post")
  const like = await A.from("post_likes").insert({ post_id: seeded.data[0].id, user_id: uidA })
  ok(!like.error, "user can like a post")

  console.log("\n[5] RLS isolation: user B cannot see A's tracker")
  const b = await B.auth.signUp({ email: `pl.pk.b.${ts}@gmail.com`, password: "Test-pw-12345!" })
  ok(!b.error && !!b.data.session, "user B signed up + session")
  const cross = await B.from("tracker_entries").select("*").eq("user_id", uidA)
  ok((cross.data?.length ?? 0) === 0, "user B sees 0 of user A's tracker rows")
  const evil = await B.from("tracker_entries").upsert(
    { user_id: uidA, entry_date: today, data: { hacked: true } },
    { onConflict: "user_id,entry_date" }
  )
  ok(!!evil.error, "user B cannot write under A's id (RLS blocks)")

  console.log("\n[6] Community public read works signed-out too")
  const anon = createClient(URL, PK, { auth: { persistSession: false } })
  const pub = await anon.from("posts").select("id").limit(1)
  ok((pub.data?.length ?? 0) >= 1, "signed-out (anon) can read the feed")
} catch (e) {
  fail++; console.log("  ✗ EXCEPTION:", e.message)
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`)
console.log("(note: throwaway users remain — delete needs the secret key)")
process.exit(fail > 0 ? 1 : 0)
