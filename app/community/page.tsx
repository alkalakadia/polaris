"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import {
  SUBS,
  ago,
  createPost,
  listPosts,
  subName,
  toggleLike,
  type Post,
} from "@/lib/community"

export default function CommunityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [active, setActive] = useState("all")
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [composing, setComposing] = useState(false)

  const load = useCallback(async () => {
    setPosts(await listPosts(active))
  }, [active])

  useEffect(() => {
    setPosts(null)
    load()
  }, [load, user])

  async function onLike(p: Post) {
    if (!user) return router.push("/account")
    // optimistic
    setPosts((prev) =>
      prev?.map((x) =>
        x.id === p.id
          ? { ...x, liked_by_me: !x.liked_by_me, hearts: x.hearts + (x.liked_by_me ? -1 : 1) }
          : x
      ) ?? prev
    )
    await toggleLike(p.id, user)
  }

  return (
    <PatientShell>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="animate-float text-3xl">💬</span>
          <div>
            <h1 className="font-cute text-3xl font-bold text-g-ink">Community</h1>
            <p className="text-sm font-semibold text-g-ink-3">Ask the girls, share your wins 💕</p>
          </div>
        </div>
        <button
          onClick={() => (user ? setComposing((v) => !v) : router.push("/account"))}
          className="rounded-full bg-candy px-4 py-2.5 text-sm font-bold text-white shadow-girly-pop active:scale-95"
        >
          {composing ? "Close" : "+ Post"}
        </button>
      </div>

      {composing && user && (
        <Composer
          defaultSub={active === "all" ? "vent" : active}
          onPosted={() => {
            setComposing(false)
            load()
          }}
        />
      )}

      {/* Sub categories */}
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {SUBS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
              active === s.id
                ? "border-transparent bg-candy text-white shadow-girly"
                : cn(s.tint, "border-g-border text-g-ink")
            )}
          >
            <span>{s.emoji}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="mt-4 space-y-3">
        {posts === null ? (
          <Loading />
        ) : posts.length === 0 ? (
          <Empty signedIn={!!user} onCompose={() => (user ? setComposing(true) : router.push("/account"))} />
        ) : (
          posts.map((p) => {
            const sn = subName(p.sub)
            return (
              <article key={p.id} className="rounded-3xl border border-g-border bg-white p-4 shadow-girly">
                <Link href={`/community/${p.id}`} className="block active:scale-[0.99]">
                  <div className="flex items-center gap-2 text-xs font-bold text-g-ink-3">
                    <span className="rounded-full bg-candy-soft px-2.5 py-1 text-g-ink">
                      {sn.emoji} {sn.name}
                    </span>
                    <span>@{p.author_name}</span>
                    <span>· {ago(p.created_at)}</span>
                  </div>
                  <h2 className="mt-2 font-cute text-lg font-bold leading-snug text-g-ink">{p.title}</h2>
                  {p.body && <p className="mt-1 line-clamp-3 text-sm font-medium text-g-ink-2">{p.body}</p>}
                </Link>
                <div className="mt-3 flex items-center gap-4 text-sm font-bold text-g-ink-3">
                  <button onClick={() => onLike(p)} className="inline-flex items-center gap-1.5 active:scale-90">
                    <span className={p.liked_by_me ? "" : "grayscale"}>💗</span> {p.hearts}
                  </button>
                  <Link href={`/community/${p.id}`} className="inline-flex items-center gap-1.5">
                    💬 {p.comment_count}
                  </Link>
                </div>
              </article>
            )
          })
        )}
      </div>

      <p className="mt-6 px-2 text-center text-xs font-semibold text-g-ink-3">
        Be kind 💗 Posts are from members, not medical professionals. Always check
        with your doctor before changing anything.
      </p>
    </PatientShell>
  )
}

function Composer({ defaultSub, onPosted }: { defaultSub: string; onPosted: () => void }) {
  const { user } = useAuth()
  const [sub, setSub] = useState(defaultSub)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function post() {
    if (!user || !title.trim()) return
    setBusy(true)
    setError(null)
    const res = await createPost({ sub, title, body, user })
    setBusy(false)
    if (res.error) setError(res.error)
    else onPosted()
  }

  return (
    <div className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1">
        {SUBS.filter((s) => s.id !== "all").map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95",
              sub === s.id ? "border-transparent bg-candy text-white" : "border-g-border bg-g-canvas text-g-ink-2"
            )}
          >
            {s.emoji} {s.name}
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 font-cute text-base font-bold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Share a little more (optional) 💭"
        className="mt-2 w-full resize-none rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
      {error && <p className="mt-2 text-sm font-bold text-g-pink-deep">💔 {error}</p>}
      <button
        onClick={post}
        disabled={busy || !title.trim()}
        className="mt-3 w-full rounded-full bg-candy py-3 font-cute text-base font-bold text-white shadow-girly-pop active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Posting…" : "Share with the girls 💕"}
      </button>
    </div>
  )
}

function Loading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/70" />
      ))}
    </div>
  )
}

function Empty({ signedIn, onCompose }: { signedIn: boolean; onCompose: () => void }) {
  return (
    <div className="rounded-3xl border border-g-border bg-white p-6 text-center shadow-girly">
      <span className="text-4xl">🌸</span>
      <p className="mt-3 font-cute text-lg font-bold text-g-ink">No posts here yet</p>
      <p className="mt-1 text-sm font-semibold text-g-ink-3">
        {signedIn ? "Be the first to start the conversation 💕" : "Sign in to start the conversation 💕"}
      </p>
      <button
        onClick={onCompose}
        className="mt-4 rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95"
      >
        {signedIn ? "Write a post ✍️" : "Sign in"}
      </button>
    </div>
  )
}
