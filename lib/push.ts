/**
 * Web Push client helpers (free reminders). Registers the service worker,
 * asks permission, subscribes with our VAPID public key, and stores the
 * subscription server-side so a daily job can nudge the user.
 */

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

export function notificationState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported"
  return Notification.permission
}

export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return !!sub
}

export async function enableReminders(opts: { hour?: number; userId?: string }): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: "Your browser doesn't support reminders. Try adding Polaris to your home screen first." }
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) return { ok: false, error: "Reminders aren't configured yet." }

  const reg = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return { ok: false, error: "Notifications are off. You can turn them on in your browser settings." }

  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    }))

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), hour: opts.hour ?? 19, userId: opts.userId }),
  })
  return res.ok ? { ok: true } : { ok: false, error: "Could not save your reminder. Try again?" }
}

export async function disableReminders(): Promise<void> {
  if (!isPushSupported()) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {})
    await sub.unsubscribe().catch(() => {})
  }
}
