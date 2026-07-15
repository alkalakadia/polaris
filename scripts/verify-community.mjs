/**
 * Community end-to-end against the real Supabase project + UI:
 *   - signed-out user can BROWSE the seeded feed (public read)
 *   - signed-in user can POST, LIKE, and COMMENT
 *   - the new post/comment land in the database
 * Creates one throwaway user; deletes it (and its content) at the end.
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
const user = { email: `polaris.comm.${ts}@gmail.com`, password: "Test-pw-12345!" }
let uid
const title = `e2e test post ${ts}`

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
  const created = await admin.auth.admin.createUser({ ...user, email_confirm: true, user_metadata: { display_name: "commtester" } })
  uid = created.data.user?.id
  ok(!!uid, "throwaway user created")

  console.log("\n[signed out] can browse seeded feed (public read)")
  const anonCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const a = await anonCtx.newPage()
  await a.goto(B + "/community", { waitUntil: "domcontentloaded" })
  await a.waitForTimeout(1500)
  const seededCount = await a.locator("article").count()
  ok(seededCount >= 3, `signed-out user sees seeded posts (${seededCount})`)

  console.log("\n[signed in] post + like + comment")
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const p = await ctx.newPage()
  await signIn(p)
  await p.goto(B + "/community", { waitUntil: "domcontentloaded" })
  await p.waitForTimeout(1200)
  // create a post
  await p.locator('button:has-text("+ Post")').click()
  await p.waitForTimeout(300)
  await p.locator('input[placeholder="What\'s on your mind?"]').fill(title)
  await p.locator('textarea[placeholder="Share a little more (optional) 💭"]').fill("body from e2e")
  await p.locator('button:has-text("Share with the girls")').click()
  await p.waitForTimeout(1800)
  const inFeed = await p.locator(`text=${title}`).count()
  ok(inFeed > 0, "new post appears in the feed")

  const dbPost = await admin.from("posts").select("id,title,sub").eq("user_id", uid).maybeSingle()
  ok(dbPost.data?.title === title, "post persisted to the database")
  const postId = dbPost.data?.id

  // open it + comment
  await p.goto(B + `/community/${postId}`, { waitUntil: "domcontentloaded" })
  await p.waitForTimeout(1200)
  await p.locator("textarea").first().fill("a kind reply from e2e")
  await p.locator('button:has-text("Send")').click()
  await p.waitForTimeout(1500)
  ok(await p.locator("text=a kind reply from e2e").count() > 0, "comment shows on the post")
  const dbComment = await admin.from("comments").select("body").eq("post_id", postId)
  ok((dbComment.data ?? []).some((c) => c.body === "a kind reply from e2e"), "comment persisted to the database")

  // like a seeded post
  await p.goto(B + "/community", { waitUntil: "domcontentloaded" })
  await p.waitForTimeout(1200)
  const likeBtns = p.locator('article button:has-text("💗")')
  const before = (await likeBtns.first().innerText()).match(/\d+/)?.[0] ?? "0"
  await likeBtns.first().click()
  await p.waitForTimeout(1200)
  const after = (await likeBtns.first().innerText()).match(/\d+/)?.[0] ?? "0"
  ok(Number(after) === Number(before) + 1, `like increments count (${before} → ${after})`)
} catch (e) {
  fail++; console.log("  ✗ EXCEPTION:", e.message)
} finally {
  if (uid) await admin.auth.admin.deleteUser(uid) // cascades posts/comments/likes
  console.log("\n[cleanup] throwaway user + content deleted")
  await browser.close()
}
console.log(`\n==== ${pass} passed, ${fail} failed ====`)
process.exit(fail > 0 ? 1 : 0)
