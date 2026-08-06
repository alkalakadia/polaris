"use client"

import { LearnChat } from "@/components/learn-chat";
import Link from "next/link"
import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { RichText } from "@/components/rich-text"
import { MedicalIcon } from "@/components/medical-icon"
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

import {
  Book,
  Heart,
  ScrollText,
  MessageCircleQuestion,
  Hourglass,
  HeartCrack,
  Stethoscope,
  FlaskConical,
  Search,
  LinkIcon,
  HeartHandshake,
  ClipboardList,
  BookOpen,
  Check,
  HeartPulse,
  Soup,
  Egg,
  Brain,
  Lightbulb,
  type LucideIcon,
} from "lucide-react"

const topicIconMap: Record<string, LucideIcon> = {
  "PMOS 101": HeartPulse,
  "Insulin & food": Soup,
  "Skin & hair": HeartPulse,
  Fertility: Egg,
  "Mental health": Brain,
  "New research": Lightbulb,
  "For you": Heart, // Default for "For you"
  Read: BookOpen, // Default for "Read"
}

interface TopicIconProps {
  topic: string
}

function TopicIcon({ topic }: TopicIconProps) {
  const IconComponent = topicIconMap[topic] || Lightbulb // Default to Lightbulb for unknown topics
  return <IconComponent size={24} /> // Adjust size as needed
}

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
      const raw: { title?: string; blurb?: string; brief?: string; topic?: string }[] = data.articles || []
      const stamp = Date.now()
      const items: Article[] = raw
        .filter((a) => a.title)
        .slice(0, 4)
        .map((a, i) => ({
          id: `fresh-${stamp}-${i}`,
          topic: a.topic && TOPICS.includes(a.topic) ? a.topic : "New research",
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
        <Book className="animate-float text-3xl" />
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Learn</h1>
          <p className="text-sm font-semibold text-g-ink-3 inline-flex items-center gap-1">
            <MedicalIcon name="research" size={14} className="text-g-ink-3" />
            Real research, made clear
          </p>
        </div>
      </div>

      {/* Quick links to the rest of "take it in" */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/wellness" className="flex items-center gap-2 rounded-3xl border border-g-border bg-white p-3.5 shadow-girly active:scale-[0.98]">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-g-mint-soft text-g-ink">
            <MedicalIcon name="headphones" size={24} className="text-current" />
          </span>
          <span className="min-w-0">
            <span className="block font-cute text-sm font-bold text-g-ink">Wellness</span>
            <span className="block text-[0.7rem] font-semibold text-g-ink-3">Calm, move, eat, listen</span>
          </span>
        </Link>
        <Link href="/guide" className="flex items-center gap-2 rounded-3xl border border-g-border bg-white p-3.5 shadow-girly active:scale-[0.98]">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-candy-soft text-g-ink">
            <MedicalIcon name="bookOpen" size={24} className="text-current" />
          </span>
          <span className="min-w-0">
            <span className="block font-cute text-sm font-bold text-g-ink">The basics</span>
            <span className="block text-[0.7rem] font-semibold text-g-ink-3">Evidence-based facts</span>
          </span>
        </Link>
      </div>

      <LearnChat />
  

      {/* Latest research — live, credible, cited, and personalized */}
      <section className="mt-4 rounded-3xl border border-g-border bg-white p-5 shadow-girly">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-g-sky-soft text-g-sky">
              <MedicalIcon name="research" size={20} className="text-current" />
            </span>
            <h2 className="font-cute text-base font-bold text-g-ink">Latest research for you</h2>
          </div>
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
            <div className="mt-1 flex items-center gap-2 text-xs font-bold text-g-ink-3">
              <MedicalIcon name="search" size={14} className="text-g-ink-3" />
              <span>Finding fresh, credible studies…</span>
            </div>
          </div>
        ) : resError ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-g-pink-soft px-3 py-2 text-sm font-bold text-g-pink-deep">
            <MedicalIcon name="heartCrack" size={16} className="text-g-pink-deep" />
            <span>{resError}</span>
          </div>
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
                      className="inline-flex items-center gap-1 rounded-full bg-g-canvas px-2.5 py-1 text-xs font-bold text-g-pink-deep underline-offset-2 hover:underline"
                    >
                      <LinkIcon size={12} />
                      <span>{s.title.slice(0, 28)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-3 text-[0.7rem] font-semibold text-g-ink-3">
              Pulled from the web and summarized. Always check with your doctor before acting on anything.
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
            {t === "Read" ? `Read${readIds.length ? ` (${readIds.length})` : ""}` : t}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="mt-4 space-y-3">
        {list.length === 0 ? (
          <p className="rounded-2xl bg-candy-soft px-4 py-4 text-center text-sm font-bold text-g-ink">
            {topic === "Read" ? "No saved reads yet — tap the checkmark on an article to keep it here" : "Nothing here yet."}
          </p>
        ) : (
          list.map((a) => {
            const read = readIds.includes(a.id)
            return (
              <article key={a.id} className="flex gap-3 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
                <Link href={`/learn/${a.id}`} onClick={() => setReadIds((r) => (r.includes(a.id) ? r : [...r, a.id]))} className="flex min-w-0 flex-1 gap-3 active:scale-[0.99]">
                  <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", a.tint)}>
                    <MedicalIcon name="document" size={24} className="text-g-ink" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-g-ink-3">{a.topic}</span>
                      {a.fresh && <span className="rounded-full bg-candy px-2 py-0.5 text-[0.6rem] font-bold text-white">NEW</span>}
                    </div>
                    <h3 className="font-cute text-base font-bold leading-snug text-g-ink">{a.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium text-g-ink-2">{a.blurb}</p>
                    <p className="mt-1.5 text-xs font-bold text-g-pink-deep">{a.read} read</p>
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
                  <MedicalIcon name="check" size={14} className={read ? "text-white" : "text-g-ink-3"} />
                </button>
              </article>
            )
          })
        )}
      </div>
    </PatientShell>
  )
}
