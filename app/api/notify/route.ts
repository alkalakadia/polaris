import { NextResponse } from "next/server"
import webpush from "web-push"
import { serverClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Sends a web-push notification to a post's author when someone likes or
 * replies to it. Fired (fire-and-forget) from the client after a like/comment
 * lands. The caller proves who they are with their Supabase access token so we
 * never notify someone about their own action and can show a real handle.
 */
export async function POST(req: Request) {
  let body: { type?: "like" | "comment"; postId?: string; token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const { type, postId, token } = body
  if (!postId || (type !== "like" && type !== "comment") || !token) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return NextResponse.json({ skipped: "no-vapid" })

  const c = serverClient()
  if (!c) return NextResponse.json({ skipped: "no-db" })

  // Who is acting? Validate their token.
  const { data: actorRes } = await c.auth.getUser(token)
  const actor = actorRes.user
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Whose post is it?
  const { data: post } = await c.from("posts").select("user_id, title").eq("id", postId).single()
  const ownerId = post?.user_id as string | undefined
  if (!ownerId || ownerId === actor.id) return NextResponse.json({ skipped: "self-or-missing" })

  const handle =
    (actor.user_metadata?.display_name as string)?.trim() || actor.email?.split("@")[0] || "Someone"
  const title = String(post?.title ?? "your post")
  const short = title.length > 48 ? title.slice(0, 47) + "…" : title

  const payload = JSON.stringify(
    type === "like"
      ? { title: "New like on your post", body: `@${handle} liked "${short}"`, url: `/community/${postId}` }
      : { title: "New reply", body: `@${handle} replied to "${short}"`, url: `/community/${postId}` }
  )

  const { data: subs } = await c
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", ownerId)
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 })

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@polaris.app", pub, priv)
  let sent = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint as string, keys: { p256dh: s.p256dh as string, auth: s.auth as string } },
        payload
      )
      sent++
    } catch (e: unknown) {
      const code = (e as { statusCode?: number })?.statusCode
      if (code === 404 || code === 410) await c.from("push_subscriptions").delete().eq("endpoint", s.endpoint)
    }
  }
  return NextResponse.json({ sent })
}
