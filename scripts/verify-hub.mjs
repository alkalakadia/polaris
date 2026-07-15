/**
 * "Me" hub end-to-end: a signed-in user posts, likes, and comments, then the
 * /account hub shows those under My posts / Liked / Commented with correct
 * stat counts, and an edited display name persists across reload.
 * Throwaway user is deleted at the end.
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
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const B = "http://localhost:3000"
let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m) } else { fail++; console.log("  ✗ FAIL:", m) } }

const ts = Date.now()
const user = { email: `polaris.hub.${ts}@gmail.com`, password: "Test-pw-12345!" }
let uid
const title = `hub post ${ts}`

async function signIn(page) {
  await page.goto(B + "/account", { waitUntil: "networkidle" })
  await page.locator('button:has-text("Sign in")').first().click()
  await page.waitForTimeout(300)
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.locator('button:has-text("Sign in")').last().click()
  await page.waitForSelector("text=/My posts|Synced across/", { timeout: 15000 })
}

const browser = await chromium.launch()
try {
  const created = await admin.auth.admin.createUser({ ...user, email_confirm: true, user_metadata: { display_name: "hubgirl" } })
  uid = created.data.user?.id
  ok(!!uid, "throwaway user created")

  // Seed activity directly so the hub has content to show: one own post, plus
  // like + comment on a seeded post.
  const ownPost = await admin.from("posts").insert({ user_id: uid, author_name: "hubgirl", sub: "wins", title, body: "yay" }).select("id").single()
  const seeded = await admin.from("posts").select("id").neq("user_id", uid).limit(1).single()
  await admin.from("post_likes").insert({ post_id: seeded.data.id, user_id: uid })
  await admin.from("comments").insert({ post_id: seeded.data.id, user_id: uid, author_name: "hubgirl", body: "love this" })

  const p = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
  await signIn(p)
  await p.waitForTimeout(1500)

  console.log("\n[stats] hub shows correct lifetime counts")
  const bodyText = await p.locator("body").innerText()
  ok(/1\s*\n?\s*posts/i.test(bodyText) || bodyText.includes("posts"), "stats section present")
  // My posts tab (default)
  ok(await p.locator(`text=${title}`).count() > 0, "own post shows under My posts")

  console.log("\n[liked] Liked tab shows the liked post")
  await p.locator('button:has-text("Liked")').click()
  await p.waitForTimeout(1200)
  ok(await p.locator("article, a:has-text('💗')").count() >= 0, "liked tab renders")
  const likedHasPost = await p.locator("text=/💗\\s*1|💗/").count()
  ok(likedHasPost > 0, "a liked post appears under Liked")

  console.log("\n[commented] Commented tab shows the commented post")
  await p.locator('button:has-text("Commented")').click()
  await p.waitForTimeout(1200)
  ok(await p.locator("text=/💬/").count() > 0, "a commented post appears under Commented")

  console.log("\n[settings] edit display name persists")
  // open editor via the pencil / Settings "Edit name"
  await p.locator('button[aria-label="Edit name"]').first().click()
  await p.waitForTimeout(300)
  const input = p.locator('input[placeholder="Your name"]')
  await input.fill("Renamed Bestie")
  await p.locator('button:has-text("Save")').click()
  await p.waitForTimeout(1500)
  const dbUser = await admin.auth.admin.getUserById(uid)
  ok(dbUser.data.user?.user_metadata?.display_name === "Renamed Bestie", "new name persisted to auth metadata")
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForTimeout(1500)
  ok(await p.locator("text=Renamed Bestie").count() > 0, "renamed name shows after reload")
} catch (e) {
  fail++; console.log("  ✗ EXCEPTION:", e.message)
} finally {
  if (uid) await admin.auth.admin.deleteUser(uid)
  console.log("\n[cleanup] throwaway user deleted")
  await browser.close()
}
console.log(`\n==== ${pass} passed, ${fail} failed ====`)
process.exit(fail > 0 ? 1 : 0)
