/**
 * Cross-device sync through the real UI against the real Supabase project:
 *   - sign in on "phone", log on the tracker  → lands in the cloud
 *   - sign in as the same user on a fresh "laptop" → the data is there
 * Creates one confirmed throwaway user and deletes it at the end.
 */
import { readFileSync } from "node:fs"
import ws from "ws"
globalThis.WebSocket = globalThis.WebSocket ?? ws
import { createClient } from "@supabase/supabase-js"
import { chromium } from "playwright"

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
const B = "http://localhost:3000"

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m) } else { fail++; console.log("  ✗ FAIL:", m) } }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
const ts = Date.now()
const user = { email: `polaris.ui.${ts}@gmail.com`, password: "Test-pw-12345!" }
let uid

async function signIn(page) {
  await page.goto(B + "/account", { waitUntil: "networkidle" })
  await page.locator('button:has-text("Sign in")').first().click()
  await page.waitForTimeout(300)
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.locator('button:has-text("Sign in")').last().click()
  await page.waitForSelector("text=/Your account|Synced across/", { timeout: 15000 })
}

const browser = await chromium.launch()
try {
  const created = await admin.auth.admin.createUser({ ...user, email_confirm: true, user_metadata: { display_name: "UI Tester" } })
  uid = created.data.user?.id
  ok(!!uid, "throwaway confirmed user created")

  console.log("\n[phone] sign in + log on tracker")
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const p1 = await phone.newPage()
  await signIn(p1)
  ok(true, "signed in via UI on phone")
  await p1.goto(B + "/track", { waitUntil: "domcontentloaded" })
  await p1.waitForTimeout(600)
  await p1.locator("button", { hasText: "Medium" }).first().click()
  await p1.locator("button", { hasText: "Happy" }).first().click()
  await p1.locator("button", { hasText: "Cramps" }).first().click()
  await p1.waitForTimeout(1500) // let cloud upsert land

  console.log("\n[cloud] entry written by the UI is in the database")
  const today = new Date().toISOString().slice(0, 10)
  const { data: rows } = await admin.from("tracker_entries").select("entry_date, data").eq("user_id", uid)
  ok((rows?.length ?? 0) === 1, "exactly 1 cloud row for this user")
  ok(rows?.[0]?.data?.flow === "medium", "cloud row has flow=medium from the UI")
  ok((rows?.[0]?.data?.moods ?? []).includes("happy"), "cloud row has mood from the UI")

  console.log("\n[laptop] fresh browser, same login → data syncs in")
  const laptop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const p2 = await laptop.newPage()
  await signIn(p2)
  // Tracker reads today's entry straight from the cloud — the most direct proof.
  await p2.goto(B + "/track", { waitUntil: "domcontentloaded" })
  await p2.waitForTimeout(2500)
  const pill = (await p2.locator("text=/of .* things logged/").first().textContent().catch(() => "")) || ""
  ok(/[1-9]/.test(pill), `tracker on 2nd device shows logged count from cloud ("${pill.trim()}")`)
  await p2.goto(B + "/", { waitUntil: "domcontentloaded" })
  await p2.waitForTimeout(2500)
  ok(await p2.locator("text=Today so far").count() > 0, "Today summary shows the synced entry on 2nd device")
  const sawCramps = await p2.locator("text=/Cramps/").count()
  ok(sawCramps > 0, "the symptom logged on phone is visible on laptop (cross-device sync ✨)")
} catch (e) {
  fail++; console.log("  ✗ EXCEPTION:", e.message)
} finally {
  if (uid) await admin.auth.admin.deleteUser(uid)
  console.log("\n[cleanup] throwaway user deleted")
  await browser.close()
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`)
process.exit(fail > 0 ? 1 : 0)
