import { NextResponse } from "next/server"
import { serverClient } from "@/lib/supabase"

export const runtime = "nodejs"

/** Store a web-push subscription so the daily reminder job can reach this device. */
export async function POST(req: Request) {
  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; hour?: number; userId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const sub = body.subscription
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }
  const c = serverClient()
  if (!c) return NextResponse.json({ error: "Not configured" }, { status: 503 })

  const { error } = await c.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      hour: typeof body.hour === "number" ? body.hour : 19,
      user_id: body.userId ?? null,
    },
    { onConflict: "endpoint" }
  )
  if (error) {
    console.error("push subscribe:", error.message)
    return NextResponse.json({ error: "Could not save" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json().catch(() => ({ endpoint: null }))
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
  const c = serverClient()
  if (!c) return NextResponse.json({ error: "Not configured" }, { status: 503 })
  await c.from("push_subscriptions").delete().eq("endpoint", endpoint)
  return NextResponse.json({ ok: true })
}
