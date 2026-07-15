"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/cn"
import { signedPostMediaUrl, type PostMedia } from "@/lib/community"

/** Renders a post's photos/videos (private bucket → short-lived signed URLs). */
export function PostMediaView({ media }: { media: PostMedia[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    let live = true
    ;(async () => {
      const out: Record<string, string> = {}
      for (const m of media ?? []) {
        const u = await signedPostMediaUrl(m.path)
        if (u) out[m.path] = u
      }
      if (live) setUrls(out)
    })()
    return () => {
      live = false
    }
  }, [media])

  if (!media || media.length === 0) return null
  return (
    <div className={cn("mt-2 grid gap-1.5", media.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
      {media.map((m, i) => {
        const url = urls[m.path]
        if (!url) {
          return <div key={i} className="grid h-40 w-full place-items-center rounded-2xl border border-g-border bg-g-canvas text-g-ink-3">…</div>
        }
        return m.type === "video" ? (
          <video
            key={i}
            src={url}
            controls
            playsInline
            className="max-h-72 w-full rounded-2xl border border-g-border bg-black object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="Post attachment" className="max-h-72 w-full rounded-2xl border border-g-border object-cover" />
        )
      })}
    </div>
  )
}
