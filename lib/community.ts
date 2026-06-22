/**
 * Community data layer — real posts, comments, and likes backed by Supabase.
 *
 * Reads are public (browse without an account); writes require sign-in and are
 * RLS-owned. Author handles are denormalized onto rows so the feed never needs
 * to read other users' profiles.
 */

import type { User } from "@supabase/supabase-js"
import { browserClient } from "@/lib/supabase"

export interface Sub {
  id: string
  name: string
  emoji: string
  tint: string
}

/** Fixed community categories (the "subs"). */
export const SUBS: Sub[] = [
  { id: "all", name: "For you", emoji: "🌸", tint: "bg-candy-soft" },
  { id: "newly", name: "Newly diagnosed", emoji: "🫧", tint: "bg-g-pink-soft" },
  { id: "ttc", name: "Trying to conceive", emoji: "🤍", tint: "bg-g-peach-soft" },
  { id: "skin", name: "Skin & hair", emoji: "✨", tint: "bg-g-lavender-soft" },
  { id: "food", name: "Food & cravings", emoji: "🍓", tint: "bg-g-mint-soft" },
  { id: "wins", name: "Wins", emoji: "🎉", tint: "bg-g-butter-soft" },
  { id: "vent", name: "Vent space", emoji: "💗", tint: "bg-g-sky-soft" },
]

export function subName(id: string): { name: string; emoji: string } {
  const s = SUBS.find((x) => x.id === id)
  return s ? { name: s.name, emoji: s.emoji } : { name: id, emoji: "🌸" }
}

export interface Post {
  id: string
  user_id: string
  author_name: string
  sub: string
  title: string
  body: string | null
  created_at: string
  hearts: number
  comment_count: number
  liked_by_me: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_name: string
  body: string
  created_at: string
}

/** A friendly handle for the signed-in user. */
export function handleFor(user: User | null): string {
  if (!user) return "bestie"
  const dn = (user.user_metadata?.display_name as string) || ""
  if (dn.trim()) return dn.trim()
  const local = user.email?.split("@")[0] ?? "bestie"
  return local
}

export function isCommunityLive(): boolean {
  return browserClient() !== null
}

/** Relative time like "2h", "3d". */
export function ago(iso: string): string {
  const then = new Date(iso).getTime()
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return "now"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

const POST_SELECT =
  "id,user_id,author_name,sub,title,body,created_at, post_likes(count), comments(count)"

function extractCount(rel: unknown): number {
  // PostgREST returns aggregate as [{ count: n }].
  if (Array.isArray(rel) && rel.length > 0 && typeof rel[0]?.count === "number") {
    return rel[0].count
  }
  return 0
}

type AnyClient = NonNullable<ReturnType<typeof browserClient>>

/** Turn raw post rows into Post[] with the current user's like state. */
async function decorate(c: AnyClient, rows: Record<string, unknown>[]): Promise<Post[]> {
  const { data: userRes } = await c.auth.getUser()
  const uid = userRes.user?.id
  let likedIds = new Set<string>()
  if (uid && rows.length) {
    const ids = rows.map((p) => p.id as string)
    const { data: likes } = await c
      .from("post_likes")
      .select("post_id")
      .eq("user_id", uid)
      .in("post_id", ids)
    likedIds = new Set((likes ?? []).map((l) => l.post_id as string))
  }
  return rows.map((p) => ({
    id: p.id as string,
    user_id: p.user_id as string,
    author_name: p.author_name as string,
    sub: p.sub as string,
    title: p.title as string,
    body: (p.body as string) ?? null,
    created_at: p.created_at as string,
    hearts: extractCount(p.post_likes),
    comment_count: extractCount(p.comments),
    liked_by_me: likedIds.has(p.id as string),
  }))
}

/** List posts (optionally filtered by sub), newest first, with counts + my-like state. */
export async function listPosts(sub?: string): Promise<Post[]> {
  const c = browserClient()
  if (!c) return []
  let query = c.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).limit(100)
  if (sub && sub !== "all") query = query.eq("sub", sub)
  const { data, error } = await query
  if (error || !data) {
    if (error) console.error("listPosts:", error.message)
    return []
  }
  return decorate(c, data as Record<string, unknown>[])
}

/** Fetch specific posts by id, preserving the given order. */
async function listPostsByIds(ids: string[]): Promise<Post[]> {
  const c = browserClient()
  if (!c || ids.length === 0) return []
  const { data, error } = await c.from("posts").select(POST_SELECT).in("id", ids)
  if (error || !data) return []
  const decorated = await decorate(c, data as Record<string, unknown>[])
  const order = new Map(ids.map((id, i) => [id, i]))
  return decorated.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

export async function getPost(id: string): Promise<Post | null> {
  const posts = await listPostsByIds([id])
  return posts[0] ?? null
}

/** Posts the user wrote, newest first. */
export async function listMyPosts(userId: string): Promise<Post[]> {
  const c = browserClient()
  if (!c) return []
  const { data, error } = await c
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return decorate(c, data as Record<string, unknown>[])
}

/** Posts the user has liked, most-recently-liked first. */
export async function listLikedPosts(userId: string): Promise<Post[]> {
  const c = browserClient()
  if (!c) return []
  const { data } = await c
    .from("post_likes")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return listPostsByIds((data ?? []).map((r) => r.post_id as string))
}

/** Posts the user has commented on (de-duplicated), most-recent comment first. */
export async function listCommentedPosts(userId: string): Promise<Post[]> {
  const c = browserClient()
  if (!c) return []
  const { data } = await c
    .from("comments")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const r of data ?? []) {
    const id = r.post_id as string
    if (!seen.has(id)) {
      seen.add(id)
      ordered.push(id)
    }
  }
  return listPostsByIds(ordered)
}

export interface ActivityCounts {
  posts: number
  likes: number
  comments: number
}

/** Lifetime community activity counts for the user. */
export async function getActivityCounts(userId: string): Promise<ActivityCounts> {
  const c = browserClient()
  if (!c) return { posts: 0, likes: 0, comments: 0 }
  const count = async (table: string) => {
    const { count } = await c.from(table).select("*", { count: "exact", head: true }).eq("user_id", userId)
    return count ?? 0
  }
  const [posts, likes, comments] = await Promise.all([count("posts"), count("post_likes"), count("comments")])
  return { posts, likes, comments }
}

export async function createPost(input: {
  sub: string
  title: string
  body: string
  user: User
}): Promise<{ id?: string; error?: string }> {
  const c = browserClient()
  if (!c) return { error: "Community isn't connected." }
  const { data, error } = await c
    .from("posts")
    .insert({
      user_id: input.user.id,
      author_name: handleFor(input.user),
      sub: input.sub,
      title: input.title.trim(),
      body: input.body.trim() || null,
    })
    .select("id")
    .single()
  if (error) return { error: error.message }
  return { id: data?.id as string }
}

/** Toggle a like. Returns the new liked state. */
export async function toggleLike(postId: string, user: User): Promise<boolean> {
  const c = browserClient()
  if (!c) return false
  const { data: existing } = await c
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (existing) {
    await c.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)
    return false
  }
  await c.from("post_likes").insert({ post_id: postId, user_id: user.id })
  return true
}

export async function listComments(postId: string): Promise<Comment[]> {
  const c = browserClient()
  if (!c) return []
  const { data, error } = await c
    .from("comments")
    .select("id,post_id,author_name,body,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
  if (error || !data) return []
  return data as Comment[]
}

export async function addComment(postId: string, body: string, user: User): Promise<{ error?: string }> {
  const c = browserClient()
  if (!c) return { error: "Community isn't connected." }
  const { error } = await c.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    author_name: handleFor(user),
    body: body.trim(),
  })
  return error ? { error: error.message } : {}
}
