"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { RichText } from "@/components/rich-text"
import { cn } from "@/lib/cn"
import { ARTICLES, TOPICS } from "@/lib/learn"
import { useAuth } from "@/lib/auth"
import { getAllEntriesAsync } from "@/lib/tracker-store"
import { getProfile, hydrateProfileFromMetadata } from "@/lib/profile"
import { healthContext } from "@/lib/clinical"

const SUGGESTIONS = [
  "Is dairy bad for PCOS?",
  "Why am I always tired?",
  "What is a good breakfast for PCOS?",
  "Can PCOS go away?",
]

export default function LearnPage() {
  const [topic, setTopic] = useState("For you")
  const list = topic === "For you" ? ARTICLES : ARTICLES.filter((a) => a.topic === topic)

  const { user } = useAuth()
  const [q, setQ] = useState("")
  const [answer, setAnswer] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState("")

  // Build a compact, non-identifying health context so answers personalize.
  useEffect(() => {
    let active = true
    if (user?.user_metadata?.cycle) hydrateProfileFromMetadata(user.user_metadata.cycle)
    const prof = getProfile()
    getAllEntriesAsync().then((all) => {
      if (active) setContext(healthContext(prof, all))
    })
    return () => {
      active = false
    }
  }, [user])

  async function ask(question: string) {
    const text = question.trim()
    if (!text || asking) return
    setQ(text)
    setAsking(true)
    setError(null)
    setAnswer(null)
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "qa", question: text, context }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || "Something went wrong.")
      else setAnswer(data.answer)
    } catch {
      setError("Couldn't reach Polaris. Try again?")
    } finally {
      setAsking(false)
    }
  }

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">📚</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Learn</h1>
          <p className="text-sm font-semibold text-g-ink-3">Real research, made cute & clear ✨</p>
        </div>
      </div>

      {/* Ask Polaris — the real, grounded Q&A */}
      <div className="mt-4 rounded-3xl bg-candy p-5 shadow-girly-pop">
        <p className="font-cute text-lg font-bold text-white">Ask Polaris 💭</p>
        <p className="mt-0.5 text-sm font-semibold text-white/90">
          A clear answer pulled from trusted research.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-2 py-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(q)}
            placeholder="e.g. is dairy bad for PCOS?"
            className="flex-1 bg-transparent px-3 py-1.5 text-sm font-semibold text-g-ink outline-none placeholder:text-g-ink-3"
          />
          <button
            onClick={() => ask(q)}
            disabled={asking || !q.trim()}
            className="rounded-full bg-candy px-4 py-2 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
          >
            {asking ? "…" : "Ask"}
          </button>
        </div>
        {!answer && !asking && !error && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="shrink-0 rounded-full bg-white/25 px-3 py-1.5 text-xs font-bold text-white active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Answer */}
      {(asking || answer || error) && (
        <div className="mt-3 rounded-3xl border border-g-border bg-white p-5 shadow-girly">
          {asking ? (
            <div className="space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-g-canvas-2" />
              <div className="h-3 w-full animate-pulse rounded-full bg-g-canvas-2" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-g-canvas-2" />
              <p className="pt-1 text-xs font-bold text-g-ink-3">Polaris is thinking… 🌸</p>
            </div>
          ) : error ? (
            <p className="text-sm font-bold text-g-pink-deep">💔 {error}</p>
          ) : (
            <>
              <RichText text={answer!} />
              <p className="mt-4 rounded-2xl bg-g-lavender-soft px-3 py-2 text-xs font-bold text-g-ink">
                🩺 General info, not medical advice. Polaris never diagnoses — please see a doctor.
              </p>
            </>
          )}
        </div>
      )}

      {/* Topics */}
      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
              topic === t
                ? "border-transparent bg-candy text-white shadow-girly"
                : "border-g-border bg-white text-g-ink-2"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="mt-4 space-y-3">
        {list.map((a) => (
          <Link
            key={a.id}
            href={`/learn/${a.id}`}
            className="flex gap-3 rounded-3xl border border-g-border bg-white p-4 shadow-girly transition active:scale-[0.99]"
          >
            <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl", a.tint)}>
              {a.emoji}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-g-ink-3">{a.topic}</span>
                {a.fresh && <span className="rounded-full bg-candy px-2 py-0.5 text-[0.6rem] font-bold text-white">NEW ✨</span>}
              </div>
              <h2 className="font-cute text-base font-bold leading-snug text-g-ink">{a.title}</h2>
              <p className="mt-0.5 text-sm font-medium text-g-ink-2">{a.blurb}</p>
              <p className="mt-1.5 text-xs font-bold text-g-pink-deep">📖 {a.read} read</p>
            </div>
          </Link>
        ))}
      </div>
    </PatientShell>
  )
}
