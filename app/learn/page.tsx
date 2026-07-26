"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { RichText } from "@/components/rich-text"
import { cn } from "@/lib/cn"
import {
  ARTICLES,
  FRESH_TINTS,
  TOPICS,
  getFreshArticles,
  getReadIds,
  interestTopics,
  rankArticles,
  setFreshArticles,
  toggleRead,
  type Article,
} from "@/lib/learn"
import { useAuth } from "@/lib/auth"
import { getAllEntriesAsync } from "@/lib/tracker-store"
import { getProfile, hydrateProfileFromMetadata, type CycleProfile } from "@/lib/profile"
import { healthContext } from "@/lib/clinical"

const SUGGESTIONS = [
  "Is dairy bad for PMOS?",
  "Why am I always tired?",
  "What is a good breakfast for PMOS?",
  "Can PMOS go away?",
]

interface Source {
  title: string
  url: string
}

export default function LearnPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CycleProfile>({})
  const [topic, setTopic] = useState("For you")
  const [readIds, setReadIds] = useState<string[]>([])
  const [context, setContext] = useState("")

  // Ask MyPMOS
  const [q, setQ] = useState("")
  const [answer, setAnswer] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)

  // Latest research (grounded, cited)
  const [resText, setResText] = useState<string | null>(null)
  const [resSources, setResSources] = useState<Source[]>([])
  const [resLoading, setResLoading] = useState(true)
  const [resError, setResError] = useState<string | null>(null)

  // Fresh AI-generated articles (regenerate on Refresh / new session)
  const [fresh, setFresh] = useState<Article[]>([])

  useEffect(() => {
    if (user?.user_metadata?.cycle) hydrateProfileFromMetadata(user.user_metadata.cycle)
    const prof = getProfile()
    setProfile(prof)
    setReadIds(getReadIds())
    let active = true
    getAllEntriesAsync().then((all) => {
      if (active) setContext(healthContext(prof, all))
    })
    loadResearch(prof, false)
    const cachedFresh = getFreshArticles()
    if (cachedFresh.length) setFresh(cachedFresh)
    else loadFresh(prof, false)
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadFresh(prof: CycleProfile, force: boolean) {
    if (!force) {
      const cached = getFreshArticles()
      if (cached.length) {
        setFresh(cached)
        return
      }
    }
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "freshtopics", topics: interestTopics(prof), seed: String(Date.now() % 100000) }),
      })
      const data = await res.json()
      const raw: { title?: string; blurb?: string; brief?: string; topic?: string; emoji?: string }[] = data.articles || []
      const stamp = Date.now()
      const items: Article[] = raw
        .filter((a) => a.title)
        .slice(0, 4)
        .map((a, i) => ({
          id: `fresh-${stamp}-${i}`,
          topic: a.topic && TOPICS.includes(a.topic) ? a.topic : "New research",
          emoji: a.emoji || "✨",
          title: a.title!,
          blurb: a.blurb || "",
          brief: a.brief || a.title!,
          read: "4 min",
          tags: [],
          fresh: true,
          tint: FRESH_TINTS[i % FRESH_TINTS.length],
        }))
      setFresh(items)
      setFreshArticles(items)
    } catch {
      /* keep existing */
    }
  }

  function refreshAll() {
    loadResearch(profile, true)
    loadFresh(profile, true)
  }

  async function loadResearch(prof: CycleProfile, force: boolean) {
    setResError(null)
    // Session cache so we don't hit the API every visit (refresh forces new).
    if (!force && typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem("polaris.learn.research")
      if (cached) {
        try {
          const c = JSON.parse(cached)
          setResText(c.text)
          setResSources(c.sources || [])
          setResLoading(false)
          return
        } catch {}
      }
    }
    setResLoading(true)
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "research", topics: interestTopics(prof) }),
      })
      const data = await res.json()
      if (!res.ok) setResError(data.error || "Couldn't load research.")
      else {
        setResText(data.answer)
        setResSources(data.sources || [])
        if (typeof window !== "undefined")
          window.sessionStorage.setItem("polaris.learn.research", JSON.stringify({ text: data.answer, sources: data.sources }))
      }
    } catch {
      setResError("Couldn't reach MyPMOS. Try again?")
    } finally {
      setResLoading(false)
    }
  }

  async function ask(question: string) {
    const text = question.trim()
    if (!text || asking) return
    setQ(text)
    setAsking(true)
    setAskError(null)
    setAnswer(null)
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "qa", question: text, context }),
      })
      const data = await res.json()
      if (!res.ok) setAskError(data.error || "Something went wrong.")
      else setAnswer(data.answer)
    } catch {
      setAskError("Couldn't reach MyPMOS. Try again?")
    } finally {
      setAsking(false)
    }
  }

  function onToggleRead(id: string) {
    setReadIds(toggleRead(id))
  }

  // Build the visible list: fresh AI picks first, then ranked curated articles.
  const ranked = rankArticles(profile)
  const allArticles = [...fresh, ...ranked]
  let list: Article[]
  if (topic === "Read") list = allArticles.filter((a) => readIds.includes(a.id))
  else if (topic === "For you") list = allArticles
  else list = allArticles.filter((a) => a.topic === topic)

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">📚</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Learn</h1>
          <p className="text-sm font-semibold text-g-ink-3">Real research, made cute & clear ✨</p>
        </div>
      </div>

      {/* Quick links to the rest of "take it in" */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/wellness" className="flex items-center gap-2 rounded-3xl border border-g-border bg-white p-3.5 shadow-girly active:scale-[0.98]">
          <span className="text-2xl">💖</span>
          <span className="min-w-0">
            <span className="block font-cute text-sm font-bold text-g-ink">Wellness</span>
            <span className="block text-[0.7rem] font-semibold text-g-ink-3">Calm, move, eat, listen</span>
          </span>
        </Link>
        <Link href="/guide" className="flex items-center gap-2 rounded-3xl border border-g-border bg-white p-3.5 shadow-girly active:scale-[0.98]">
          <span className="text-2xl">📗</span>
          <span className="min-w-0">
            <span className="block font-cute text-sm font-bold text-g-ink">The basics</span>
            <span className="block text-[0.7rem] font-semibold text-g-ink-3">Evidence-based facts</span>
          </span>
        </Link>
      </div>

      {/* Ask MyPMOS */}
      <div className="mt-4 rounded-3xl bg-candy p-5 shadow-girly-pop">
        <p className="font-cute text-lg font-bold text-white">Ask MyPMOS 💭</p>
        <p className="mt-0.5 text-sm font-semibold text-white/90">A clear answer pulled from trusted research, personalized to you.</p>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-2 py-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(q)}
            placeholder="e.g. is dairy bad for PMOS?"
            className="flex-1 bg-transparent px-3 py-1.5 text-sm font-semibold text-g-ink outline-none placeholder:text-g-ink-3"
          />
          <button onClick={() => ask(q)} disabled={asking || !q.trim()} className="rounded-full bg-candy px-4 py-2 text-sm font-bold text-white active:scale-95 disabled:opacity-60">
            {asking ? "…" : "Ask"}
          </button>
        </div>
        {!answer && !asking && !askError && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="shrink-0 rounded-full bg-white/25 px-3 py-1.5 text-xs font-bold text-white active:scale-95">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {(asking || answer || askError) && (
        <div className="mt-3 rounded-3xl border border-g-border bg-white p-5 shadow-girly">
          {asking ? (
            <p className="text-sm font-bold text-g-ink-3">MyPMOS is thinking… 🌸</p>
          ) : askError ? (
            <p className="text-sm font-bold text-g-pink-deep">💔 {askError}</p>
          ) : (
            <>
              <RichText text={answer!} />
              <p className="mt-4 rounded-2xl bg-g-lavender-soft px-3 py-2 text-xs font-bold text-g-ink">
                🩺 General info, not medical advice. MyPMOS never diagnoses — please see a doctor.
              </p>
            </>
          )}
        </div>
      )}

      {/* Latest research — live, credible, cited, and personalized */}
      <section className="mt-4 rounded-3xl border border-g-border bg-white p-5 shadow-girly">
        <div className="flex items-center justify-between">
          <h2 className="font-cute text-base font-bold text-g-ink">🔬 Latest research for you</h2>
          <button
            onClick={refreshAll}
            disabled={resLoading}
            title="Refresh research + articles"
            className="rounded-full bg-candy-soft px-3 py-1.5 text-xs font-bold text-g-pink-deep active:scale-95 disabled:opacity-50"
          >
            {resLoading ? "…" : "Refresh"}
          </button>
        </div>
        {resLoading ? (
          <div className="mt-3 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-g-canvas-2" />
            <div className="h-3 w-full animate-pulse rounded-full bg-g-canvas-2" />
            <p className="pt-1 text-xs font-bold text-g-ink-3">Finding fresh, credible studies… 🔎</p>
          </div>
        ) : resError ? (
          <p className="mt-2 text-sm font-bold text-g-pink-deep">💔 {resError}</p>
        ) : (
          <div className="mt-2">
            <RichText text={resText || ""} />
            {resSources.length > 0 && (
              <div className="mt-3">
                <p className="text-[0.7rem] font-bold uppercase tracking-wide text-g-ink-3">Sources</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {resSources.slice(0, 6).map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-g-canvas px-2.5 py-1 text-xs font-bold text-g-pink-deep underline-offset-2 hover:underline"
                    >
                      🔗 {s.title.slice(0, 28)}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-3 text-[0.7rem] font-semibold text-g-ink-3">
              Pulled from the web and summarized. Always check with your doctor before acting on anything. 💗
            </p>
          </div>
        )}
      </section>

      {/* Topics + Read tab */}
      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {[...TOPICS, "Read"].map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
              topic === t ? "border-transparent bg-candy text-white shadow-girly" : "border-g-border bg-white text-g-ink-2"
            )}
          >
            {t === "Read" ? `📑 Read${readIds.length ? ` (${readIds.length})` : ""}` : t}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="mt-4 space-y-3">
        {list.length === 0 ? (
          <p className="rounded-2xl bg-candy-soft px-4 py-4 text-center text-sm font-bold text-g-ink">
            {topic === "Read" ? "No saved reads yet — tap ✓ on an article to keep it here" : "Nothing here yet."}
          </p>
        ) : (
          list.map((a) => {
            const read = readIds.includes(a.id)
            return (
              <article key={a.id} className="flex gap-3 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
                <Link href={`/learn/${a.id}`} onClick={() => setReadIds((r) => (r.includes(a.id) ? r : [...r, a.id]))} className="flex min-w-0 flex-1 gap-3 active:scale-[0.99]">
                  <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl", a.tint)}>{a.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-g-ink-3">{a.topic}</span>
                      {a.fresh && <span className="rounded-full bg-candy px-2 py-0.5 text-[0.6rem] font-bold text-white">NEW ✨</span>}
                    </div>
                    <h3 className="font-cute text-base font-bold leading-snug text-g-ink">{a.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium text-g-ink-2">{a.blurb}</p>
                    <p className="mt-1.5 text-xs font-bold text-g-pink-deep">📖 {a.read} read</p>
                  </div>
                </Link>
                <button
                  onClick={() => onToggleRead(a.id)}
                  aria-label={read ? "Mark unread" : "Mark read"}
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center self-start rounded-full text-sm font-bold transition active:scale-90",
                    read ? "bg-candy text-white" : "bg-g-canvas text-g-ink-3"
                  )}
                >
                  ✓
                </button>
              </article>
            )
          })
        )}
      </div>
    </PatientShell>
  )
}
