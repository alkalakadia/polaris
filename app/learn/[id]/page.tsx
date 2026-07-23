"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { RichText } from "@/components/rich-text"
import { cn } from "@/lib/cn"
import { getArticle, markRead } from "@/lib/learn"

export default function ArticlePage() {
  const params = useParams<{ id: string }>()
  const article = getArticle(params.id)

  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = `polaris.learn.${params.id}`

  const generate = useCallback(
    async (force = false) => {
      if (!article) return
      setError(null)
      setContent(null)
      // Session cache so re-opening is instant + saves API calls.
      if (!force && typeof window !== "undefined") {
        const cached = window.sessionStorage.getItem(cacheKey)
        if (cached) {
          setContent(cached)
          return
        }
      }
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "explainer", title: article.title, topic: article.brief }),
        })
        const data = await res.json()
        if (!res.ok) setError(data.error || "Couldn't write this one.")
        else {
          setContent(data.answer)
          if (typeof window !== "undefined") window.sessionStorage.setItem(cacheKey, data.answer)
        }
      } catch {
        setError("Couldn't reach MyPMOS. Try again?")
      }
    },
    [article, cacheKey]
  )

  useEffect(() => {
    generate()
    if (article) markRead(params.id)
  }, [generate, article, params.id])

  if (!article) {
    return (
      <PatientShell>
        <Link href="/learn" className="text-sm font-bold text-g-ink-3">← Learn</Link>
        <p className="mt-6 text-center font-cute text-lg font-bold text-g-ink">Article not found 🌸</p>
      </PatientShell>
    )
  }

  return (
    <PatientShell>
      <Link href="/learn" className="text-sm font-bold text-g-ink-3 active:scale-95">
        ← Learn
      </Link>

      {/* Article header */}
      <div className="mt-3 flex items-center gap-3">
        <span className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-3xl", article.tint)}>
          {article.emoji}
        </span>
        <div>
          <p className="text-xs font-bold text-g-ink-3">{article.topic}</p>
          <h1 className="font-cute text-2xl font-bold leading-tight text-g-ink">{article.title}</h1>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-g-border bg-white p-5 shadow-girly">
        {content === null && !error ? (
          <div className="space-y-2.5">
            {[2, 3, 3, 2].map((w, i) => (
              <div key={i} className={cn("h-3 animate-pulse rounded-full bg-g-canvas-2", w === 2 ? "w-2/3" : "w-full")} />
            ))}
            <p className="pt-1 text-xs font-bold text-g-ink-3">MyPMOS is writing this for you…</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-sm font-bold text-g-pink-deep">💔 {error}</p>
            <button
              onClick={() => generate(true)}
              className="mt-3 rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <RichText text={content!} />
            <p className="mt-5 rounded-2xl bg-g-lavender-soft px-3 py-2.5 text-xs font-bold text-g-ink">
              🩺 This is general education, not medical advice. MyPMOS never diagnoses — please talk to
              your gynecologist about your own health.
            </p>
          </>
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-candy p-4 text-center shadow-girly">
        <p className="text-sm font-bold text-white">Got a follow-up question? 💭</p>
        <Link href="/learn" className="mt-2 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-g-pink-deep active:scale-95">
          Ask MyPMOS
        </Link>
      </div>
    </PatientShell>
  )
}
