"use client"

import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { WellnessEmbed } from "@/components/wellness-embed"
import { cn } from "@/lib/cn"
import {
  CATEGORIES,
  addUserLink,
  embedFromUrl,
  featuredFor,
  getUserLinks,
  ideasFor,
  openUrl,
  picksFor,
  removeUserLink,
  type Category,
  type Pick,
  type UserLink,
} from "@/lib/wellness"

const HEADING: Record<Category, string> = {
  calm: "Calm picks 🧘‍♀️",
  listen: "Shows we love 🎧",
  move: "Workouts to try 💪",
  eat: "Recipes to try 🍓",
}
const NOUN: Record<Category, string> = {
  calm: "playlists",
  listen: "podcasts",
  move: "videos",
  eat: "recipe videos",
}

export default function WellnessPage() {
  const [tab, setTab] = useState<Category>("calm")
  const [links, setLinks] = useState<UserLink[]>([])
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    setLinks(getUserLinks())
  }, [])

  const cat = CATEGORIES.find((c) => c.id === tab)!
  const mine = links.filter((l) => l.category === tab)
  const picks = picksFor(tab, seed)
  const featured = featuredFor(tab, seed)
  const ideas = ideasFor(tab, seed)

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">💖</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Wellness</h1>
          <p className="text-sm font-semibold text-g-ink-3">Calm, listen, and move — at your own pace 🌷</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setTab(c.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition active:scale-95",
              tab === c.id
                ? "border-transparent bg-candy text-white shadow-girly"
                : "border-g-border bg-white text-g-ink"
            )}
          >
            <span>{c.emoji}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">{cat.tagline}</p>

      {tab === "eat" && (
        <a
          href="/guide"
          className="mt-2 flex items-center justify-between rounded-2xl border border-g-border bg-white px-4 py-2.5 text-sm font-bold text-g-ink shadow-girly active:scale-[0.99]"
        >
          <span>📗 No single diet is &ldquo;best&rdquo; — see what the guidelines say</span>
          <span className="text-g-ink-3">›</span>
        </a>
      )}

      {/* Featured today — plays embedded, rotates daily + on refresh */}
      <div className="mt-4 flex items-center justify-between px-1">
        <h2 className="font-cute text-base font-bold text-g-ink">✨ Featured today</h2>
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-g-pink-deep shadow-girly active:scale-95"
        >
          🔄 Refresh
        </button>
      </div>
      {featured && (
        <div key={`${tab}-${seed}`} className="mt-2 rounded-3xl border border-g-border bg-white p-3 shadow-girly">
          <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
            <span className="line-clamp-1 font-cute text-sm font-bold text-g-ink">{featured.title}</span>
            {featured.by && <span className="shrink-0 text-[0.7rem] font-bold text-g-ink-3">{featured.by}</span>}
          </div>
          <WellnessEmbed url={featured.url} />
        </div>
      )}

      {/* Quick ideas (e.g. food tips) */}
      {ideas.length > 0 && (
        <section className="mt-5">
          <h2 className="px-1 font-cute text-base font-bold text-g-ink">Quick ideas 💡</h2>
          <div className="mt-2 space-y-2">
            {ideas.map((idea, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-2xl border border-g-border bg-white px-3.5 py-2.5 text-sm font-medium text-g-ink-2 shadow-girly"
              >
                <span className="text-base leading-snug">🍽️</span>
                <span className="leading-snug">{idea}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add your own */}
      <AddYourOwn
        category={tab}
        onAdded={() => setLinks(getUserLinks())}
      />

      {/* Your saved links (embedded players) */}
      {mine.length > 0 && (
        <section className="mt-5">
          <h2 className="px-1 font-cute text-base font-bold text-g-ink">Your library 💝</h2>
          <div className="mt-2 space-y-3">
            {mine.map((l) => (
              <div key={l.id} className="rounded-3xl border border-g-border bg-white p-3 shadow-girly">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="line-clamp-1 text-sm font-bold text-g-ink">{l.title}</span>
                  <button
                    onClick={() => setLinks(removeUserLink(l.id))}
                    className="shrink-0 text-xs font-bold text-g-pink-deep active:scale-90"
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                </div>
                <WellnessEmbed url={l.url} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Curated picks */}
      <section className="mt-5">
        <h2 className="px-1 font-cute text-base font-bold text-g-ink">{HEADING[tab]}</h2>
        <p className="mt-0.5 px-1 text-xs font-semibold text-g-ink-3">
          Real, hand-picked {NOUN[tab]} — opens in {picks[0]?.provider === "spotify" ? "Spotify" : "YouTube"}.
        </p>
        <div className="mt-2 space-y-2.5">
          {picks.map((p) => (
            <PickCard key={p.title} pick={p} />
          ))}
        </div>
      </section>

      {tab === "move" && (
        <p className="mt-5 rounded-2xl bg-g-mint-soft px-4 py-3 text-xs font-semibold text-g-ink">
          🌿 Movement should feel good. Rest when your body asks for it, and check with your doctor before
          starting something new. This isn't medical advice.
        </p>
      )}
      {tab === "eat" && (
        <p className="mt-5 rounded-2xl bg-g-peach-soft px-4 py-3 text-xs font-semibold text-g-ink">
          🍓 Food ideas, not a meal plan. Everyone's body is different, so take what works for you and check
          with your doctor or a dietitian before big changes. This isn't medical advice.
        </p>
      )}
    </PatientShell>
  )
}

function PickCard({ pick }: { pick: Pick }) {
  return (
    <a
      href={openUrl(pick)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-3xl border border-g-border bg-white p-3.5 shadow-girly transition active:scale-[0.99]"
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg",
          pick.provider === "spotify" ? "bg-g-mint-soft" : "bg-g-pink-soft"
        )}
      >
        {pick.provider === "spotify" ? "🎵" : "▶️"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-cute text-sm font-bold leading-snug text-g-ink">{pick.title}</p>
        {pick.by && <p className="text-[0.7rem] font-bold text-g-ink-3">{pick.by}</p>}
        <p className="mt-0.5 line-clamp-2 text-xs font-medium text-g-ink-2">{pick.why}</p>
      </div>
      <span className="shrink-0 text-g-ink-3">↗</span>
    </a>
  )
}

function AddYourOwn({ category, onAdded }: { category: Category; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)

  const valid = !!embedFromUrl(url)

  function add() {
    setError(null)
    const res = addUserLink({ url, title, category })
    if (res.error) {
      setError(res.error)
      return
    }
    setUrl("")
    setTitle("")
    setOpen(false)
    onAdded()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-2xl border border-dashed border-g-pink bg-white px-4 py-3 text-sm font-bold text-g-pink-deep active:scale-[0.99]"
      >
        ＋ Add your own Spotify playlist or YouTube link
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <p className="font-cute text-sm font-bold text-g-ink">Paste a link 💕</p>
      <p className="mt-0.5 text-xs font-semibold text-g-ink-3">
        A Spotify playlist/podcast or a YouTube video — we&apos;ll play it right here.
      </p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://open.spotify.com/… or https://youtu.be/…"
        className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give it a name (optional)"
        className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
      {url && !valid && (
        <p className="mt-2 text-xs font-bold text-g-pink-deep">
          That doesn&apos;t look like a Spotify or YouTube link yet.
        </p>
      )}
      {error && <p className="mt-2 text-xs font-bold text-g-pink-deep">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={add}
          disabled={!valid}
          className="rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
        >
          Add to my library
        </button>
        <button
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          className="rounded-full border border-g-border bg-white px-5 py-2.5 text-sm font-bold text-g-ink-2 active:scale-95"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
