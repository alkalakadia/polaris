/* Polaris service worker — installability + web push + notification clicks. */
const CACHE = "polaris-shell-v1"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// Network-first for navigations, with a soft fallback so the app shell still
// opens offline. Everything else passes straight through.
self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.open(CACHE).then((c) => c.match("/").then((r) => r || fetch("/")))
      )
    )
  }
})

// A push arrived from our server — show the reminder.
self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = {}
  }
  const title = data.title || "Polaris 🌸"
  const body = data.body || "Time for a little check-in with yourself today 💕"
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "polaris-reminder",
      data: { url: data.url || "/track" },
      vibrate: [80, 40, 80],
    })
  )
})

// Tapping the notification opens (or focuses) the app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
