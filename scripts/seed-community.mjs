/**
 * Seed the community with a few starter posts, comments, and likes so the feed
 * isn't empty. Idempotent: it removes any previously-seeded content (by the
 * seed users) before re-inserting. Run with: node scripts/seed-community.mjs
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
env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
env.SUPABASE_SERVICE_ROLE_KEY ||= env.SUPABASE_SECRET_KEY
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const SEED_USERS = [
  { handle: "rosypeach", email: "seed.rosypeach@polaris.app" },
  { handle: "lunabug", email: "seed.lunabug@polaris.app" },
  { handle: "mochi.girl", email: "seed.mochigirl@polaris.app" },
  { handle: "berrysweet", email: "seed.berrysweet@polaris.app" },
]

async function ensureUser(u) {
  // Look for an existing seed user first (idempotent).
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const found = data?.users?.find((x) => x.email === u.email)
  if (found) return found.id
  const created = await admin.auth.admin.createUser({
    email: u.email,
    password: "Seed-pw-12345!",
    email_confirm: true,
    user_metadata: { display_name: u.handle },
  })
  return created.data.user?.id
}

const hours = (n) => new Date(Date.now() - n * 3600_000).toISOString()

async function main() {
  const ids = {}
  for (const u of SEED_USERS) ids[u.handle] = await ensureUser(u)
  console.log("seed users ready:", Object.keys(ids).join(", "))

  // Wipe previously-seeded posts (cascades comments + likes).
  await admin.from("posts").delete().in("user_id", Object.values(ids))

  const POSTS = [
    {
      handle: "rosypeach", sub: "skin", created_at: hours(2),
      title: "Inositol cleared my skin?? anyone else 🥹",
      body: "3 months on myo-inositol and my chin breakouts are SO much calmer. not a cure but wow. talk to your doctor first ofc but wanted to share a lil hope 💕",
    },
    {
      handle: "lunabug", sub: "newly", created_at: hours(5),
      title: "just got diagnosed at 22 and i'm a little scared",
      body: "doctor said PCOS and kind of rushed me out. what do i actually do first? 🥺 any gentle advice appreciated",
    },
    {
      handle: "mochi.girl", sub: "wins", created_at: hours(8),
      title: "first regular period in 8 MONTHS 🎉🎉",
      body: "tracking everything here + daily walks finally paid off. proud of me fr. it's possible bestie 💗",
    },
    {
      handle: "berrysweet", sub: "food", created_at: hours(26),
      title: "snacks that don't spike me + actually taste good?",
      body: "drop your faves pls, i'm so bored of eggs and almonds 😭",
    },
    {
      handle: "lunabug", sub: "vent", created_at: hours(30),
      title: "so tired of being told to 'just lose weight' 😮‍💨",
      body: "anyone else feel unheard at appointments? how do you advocate for yourself?",
    },
  ]

  const inserted = []
  for (const p of POSTS) {
    const { data, error } = await admin
      .from("posts")
      .insert({
        user_id: ids[p.handle],
        author_name: p.handle,
        sub: p.sub,
        title: p.title,
        body: p.body,
        created_at: p.created_at,
      })
      .select("id")
      .single()
    if (error) {
      console.error("post insert failed:", error.message)
      continue
    }
    inserted.push({ id: data.id, ...p })
  }
  console.log(`inserted ${inserted.length} posts`)

  // A few likes (each from a different seed user, so counts are realistic).
  const likeRows = []
  inserted.forEach((post, i) => {
    const likers = SEED_USERS.filter((u) => u.handle !== post.handle).slice(0, (i % 3) + 1)
    for (const u of likers) likeRows.push({ post_id: post.id, user_id: ids[u.handle] })
  })
  if (likeRows.length) {
    const { error } = await admin.from("post_likes").insert(likeRows)
    if (error) console.error("likes insert:", error.message)
  }
  console.log(`inserted ${likeRows.length} likes`)

  // A couple of comments on the first two posts.
  const comments = [
    { post: inserted[0], handle: "mochi.girl", body: "omg same!! the d-chiro combo helped me too ✨" },
    { post: inserted[0], handle: "berrysweet", body: "saving this, thank you for sharing 🥹" },
    { post: inserted[1], handle: "rosypeach", body: "welcome bestie 💗 start by tracking your cycle + symptoms, it makes appts so much easier" },
    { post: inserted[2], handle: "lunabug", body: "this gives me hope 😭 congrats!!" },
  ].filter((c) => c.post)
  const commentRows = comments.map((c) => ({
    post_id: c.post.id,
    user_id: ids[c.handle],
    author_name: c.handle,
    body: c.body,
  }))
  if (commentRows.length) {
    const { error } = await admin.from("comments").insert(commentRows)
    if (error) console.error("comments insert:", error.message)
  }
  console.log(`inserted ${commentRows.length} comments`)
  console.log("✓ community seeded")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
