import { NextResponse } from "next/server"
import webpush from "web-push"
import { serverClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MESSAGES = [
  { title: "MyPMOS", body: "How are you feeling today? A quick log keeps your patterns sharp." },
  { title: "Daily check-in", body: "30 seconds to check in. Your future self (and your doctor) will thank you." },
  { title: "Daily check-in", body: "Mood, symptoms, energy — log what you've got today." },
  { title: "MyPMOS", body: "Your cycle is always changing. Capture today so nothing gets lost." },
]

export async function GET(req: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
  }

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return NextResponse.json({ error: "No VAPID keys" }, { status: 503 })
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@polaris.app", pub, priv)

  const c = serverClient()
  if (!c) return NextResponse.json({ sent: 0 })

  const { data } = await c.from("push_subscriptions").select("endpoint, p256dh, auth")
  const msg = MESSAGES[new Date().getDate() % MESSAGES.length]
  const payload = JSON.stringify({ ...msg, url: "/track" })

  let sent = 0
  let removed = 0
  for (const s of data ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint as string, keys: { p256dh: s.p256dh as string, auth: s.auth as string } },
        payload
      )
      sent++
    } catch (e: unknown) {
      const code = (e as { statusCode?: number })?.statusCode
      if (code === 404 || code === 410) {
        await c.from("push_subscriptions").delete().eq("endpoint", s.endpoint)
        removed++
      }
    }
  }
  return NextResponse.json({ sent, removed })
}
