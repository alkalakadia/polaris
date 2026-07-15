import { NextResponse } from "next/server"
import { serverClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Permanently delete the signed-in user and ALL their data (GDPR/CCPA right to
 * erasure). The caller proves identity with their Supabase access token; we
 * verify it, then use the service role to remove their rows, files, and the
 * auth user itself.
 */
export async function POST(req: Request) {
  let token: string | undefined
  try {
    token = (await req.json())?.token
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const c = serverClient()
  if (!c) return NextResponse.json({ error: "Not configured" }, { status: 503 })

  const { data: userRes } = await c.auth.getUser(token)
  const uid = userRes.user?.id
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 1) Storage: remove everything under the user's folders (private + public).
  for (const [bucket, prefixes] of [
    ["lab-photos", [uid, `${uid}/hirsutism`]],
    ["post-media", [uid]],
  ] as const) {
    for (const prefix of prefixes) {
      const { data: files } = await c.storage.from(bucket).list(prefix, { limit: 1000 })
      if (files && files.length) {
        const paths = files.filter((f) => f.name).map((f) => `${prefix}/${f.name}`)
        if (paths.length) await c.storage.from(bucket).remove(paths).catch(() => {})
      }
    }
  }

  // 2) Database rows (FK-safe order).
  await c.from("post_likes").delete().eq("user_id", uid)
  await c.from("comments").delete().eq("user_id", uid)
  await c.from("posts").delete().eq("user_id", uid)
  await c.from("tracker_entries").delete().eq("user_id", uid)
  await c.from("push_subscriptions").delete().eq("user_id", uid)
  await c.from("profiles").delete().eq("id", uid)

  // 3) The auth user itself.
  const { error } = await c.auth.admin.deleteUser(uid)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
