"use client"

import { embedFromUrl } from "@/lib/wellness"

/** Inline player for a pasted Spotify or YouTube link. */
export function WellnessEmbed({ url }: { url: string }) {
  const e = embedFromUrl(url)
  if (!e) return null

  if (e.provider === "spotify") {
    return (
      <iframe
        src={e.embedUrl}
        title="Spotify player"
        height={e.tall ? 352 : 152}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="w-full rounded-2xl border border-g-border"
      />
    )
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-g-border bg-black">
      <iframe
        src={e.embedUrl}
        title="YouTube player"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}
