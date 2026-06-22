"use client"

import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/cn"
import {
  ago,
  getActivityCounts,
  listCommentedPosts,
  listLikedPosts,
  listMyPosts,
  subName,
  type ActivityCounts,
  type Post,
} from "@/lib/community"
import { getAllEntriesAsync } from "@/lib/tracker-store"
import { entryFilledCount, getStreak } from "@/lib/tracker"

export default function AccountPage() {
  const { user, configured, loading, signIn, signUp, signOut } = useAuth()
  const [mode, setMode] = useState<"in" | "up">("up")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res =
      mode === "in"
        ? await signIn(email, password)
        : await signUp(email, password, name)
    setBusy(false)
    if (res.error) setError(res.error)
    else if ("needsConfirm" in res && res.needsConfirm) setConfirmSent(true)
  }

  // --- signed in: the "Me" hub -------------------------------------------
  if (configured && user) {
    return (
      <PatientShell>
        <AccountHub user={user} />
      </PatientShell>
    )
  }

  // --- Supabase not configured (on-device only) ---------------------------
  if (!configured) {
    return (
      <PatientShell>
        <Hero emoji="☁︎" title="Cloud sync" sub="Coming online soon 💕" />
        <div className="mt-5 rounded-3xl border border-g-border bg-white p-6 text-center shadow-girly">
          <span className="text-4xl">📱</span>
          <p className="mt-3 font-cute text-lg font-bold text-g-ink">You're all set on this device</p>
          <p className="mt-1 text-sm font-semibold text-g-ink-2">
            Everything you track is saved right here on your phone. Cloud accounts
            (to sync across devices) turn on as soon as we connect the database.
          </p>
        </div>
      </PatientShell>
    )
  }

  // --- confirmation sent --------------------------------------------------
  if (confirmSent) {
    return (
      <PatientShell>
        <Hero emoji="💌" title="Check your email" sub="One little step left" />
        <div className="mt-5 rounded-3xl border border-g-border bg-white p-6 text-center shadow-girly">
          <span className="text-4xl">📬</span>
          <p className="mt-3 font-cute text-lg font-bold text-g-ink">Confirm your email</p>
          <p className="mt-1 text-sm font-semibold text-g-ink-2">
            We sent a link to <span className="font-bold text-g-ink">{email}</span>. Tap it to
            finish creating your account, then come back and sign in.
          </p>
          <button
            onClick={() => {
              setConfirmSent(false)
              setMode("in")
            }}
            className="mt-4 rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95"
          >
            Back to sign in
          </button>
        </div>
      </PatientShell>
    )
  }

  // --- signed out: sign in / sign up form ---------------------------------
  return (
    <PatientShell>
      <Hero emoji="🌸" title={mode === "up" ? "Create your account" : "Welcome back"} sub="Sync your tracker everywhere 💗" />

      {/* mode toggle */}
      <div className="mt-5 flex rounded-full bg-white p-1 shadow-girly">
        {(["up", "in"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m)
              setError(null)
            }}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-bold transition",
              mode === m ? "bg-candy text-white shadow-girly" : "text-g-ink-2"
            )}
          >
            {m === "up" ? "Sign up" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        {mode === "up" && (
          <Field label="Your name (optional)" value={name} onChange={setName} placeholder="e.g. Sarah" />
        )}
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" required />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

        {error && (
          <p className="rounded-2xl bg-g-pink-soft px-4 py-3 text-sm font-bold text-g-pink-deep">
            💔 {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || loading}
          className="w-full rounded-full bg-candy py-4 font-cute text-lg font-bold text-white shadow-girly-pop transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "One sec…" : mode === "up" ? "Create account 💕" : "Sign in 🌷"}
        </button>
      </form>

      <p className="mt-4 px-2 text-center text-xs font-semibold text-g-ink-3">
        Your tracked data is private to you. We never share it. Polaris is a
        companion, not a doctor, and never diagnoses. 💗
      </p>
    </PatientShell>
  )
}

type ActivityTab = "posts" | "liked" | "commented"

function AccountHub({ user }: { user: User }) {
  const { signOut, updateName } = useAuth()
  const [counts, setCounts] = useState<ActivityCounts>({ posts: 0, likes: 0, comments: 0 })
  const [days, setDays] = useState(0)
  const [streak, setStreak] = useState(0)
  const [tab, setTab] = useState<ActivityTab>("posts")
  const [list, setList] = useState<Post[] | null>(null)

  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState((user.user_metadata?.display_name as string) || "")
  const [savingName, setSavingName] = useState(false)

  // Lifetime stats: community counts + tracker totals.
  useEffect(() => {
    let active = true
    getActivityCounts(user.id).then((c) => active && setCounts(c))
    getAllEntriesAsync().then((all) => {
      if (!active) return
      setDays(all.filter((e) => entryFilledCount(e) > 0).length)
      setStreak(getStreak(all))
    })
    return () => {
      active = false
    }
  }, [user])

  // Load the active activity tab.
  const loadTab = useCallback(async () => {
    setList(null)
    const fn = tab === "posts" ? listMyPosts : tab === "liked" ? listLikedPosts : listCommentedPosts
    setList(await fn(user.id))
  }, [tab, user])

  useEffect(() => {
    loadTab()
  }, [loadTab])

  async function saveName() {
    setSavingName(true)
    await updateName(nameDraft)
    setSavingName(false)
    setEditing(false)
  }

  const displayName = (user.user_metadata?.display_name as string) || "Hi bestie!"

  return (
    <>
      {/* Profile header */}
      <div className="rounded-3xl border border-g-border bg-white p-5 shadow-girly">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-candy text-xl font-bold text-white">
            {(displayName[0] ?? "🌸").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Your name"
                  className="min-w-0 flex-1 rounded-xl border border-g-border bg-g-canvas px-3 py-2 text-sm font-bold text-g-ink outline-none focus:border-g-pink"
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  className="rounded-xl bg-candy px-3 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
                >
                  {savingName ? "…" : "Save"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="truncate font-cute text-xl font-bold text-g-ink">{displayName}</p>
                <button onClick={() => setEditing(true)} className="text-sm active:scale-90" aria-label="Edit name">
                  ✏️
                </button>
              </div>
            )}
            <p className="truncate text-sm font-semibold text-g-ink-3">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-g-mint-soft px-3 py-2">
          <span>✨</span>
          <p className="text-xs font-bold text-g-ink">Synced across all your devices</p>
        </div>
      </div>

      {/* Stats — everything important in one place */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stat emoji="📅" value={days} label="days tracked" tint="bg-g-pink-soft" />
        <Stat emoji="🔥" value={streak} label="day streak" tint="bg-g-peach-soft" />
        <Stat emoji="✍️" value={counts.posts} label="posts" tint="bg-g-lavender-soft" />
        <Stat emoji="💗" value={counts.likes} label="likes" tint="bg-g-sky-soft" />
        <Stat emoji="💬" value={counts.comments} label="comments" tint="bg-g-mint-soft" />
        <Link
          href="/export"
          className="grid place-items-center rounded-3xl border border-g-border bg-candy text-center shadow-girly active:scale-[0.97]"
        >
          <span className="text-lg">📄</span>
          <span className="px-1 text-[0.65rem] font-bold leading-tight text-white">Gyno PDF</span>
        </Link>
      </div>

      {/* Activity */}
      <div className="mt-5 flex rounded-full bg-white p-1 shadow-girly">
        {([
          ["posts", "My posts"],
          ["liked", "Liked"],
          ["commented", "Commented"],
        ] as [ActivityTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-bold transition",
              tab === id ? "bg-candy text-white shadow-girly" : "text-g-ink-2"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2.5">
        {list === null ? (
          [0, 1].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/70" />)
        ) : list.length === 0 ? (
          <p className="rounded-2xl bg-candy-soft px-4 py-4 text-center text-sm font-bold text-g-ink">
            {tab === "posts"
              ? "You haven't posted yet — share something with the girls 💕"
              : tab === "liked"
                ? "No liked posts yet 💗"
                : "You haven't commented yet 💬"}
          </p>
        ) : (
          list.map((p) => <PostRow key={p.id} post={p} />)
        )}
      </div>

      {/* Settings */}
      <h2 className="mt-6 px-1 font-cute text-base font-bold text-g-ink">Settings</h2>
      <div className="mt-2 overflow-hidden rounded-3xl border border-g-border bg-white shadow-girly">
        <SettingRow emoji="✏️" label="Edit name" onClick={() => setEditing(true)} />
        <SettingRow emoji="🌙" label="Edit cycle & goals" href="/onboarding" />
        <SettingRow emoji="🩺" label="My health profile" href="/health" />
        <SettingRow emoji="📄" label="Export my data (Gyno PDF)" href="/export" />
        <SettingRow emoji="💬" label="Browse community" href="/community" />
        <SettingRow emoji="🚪" label="Sign out" onClick={() => void signOut()} danger />
      </div>

      <p className="mt-4 px-2 text-center text-xs font-semibold text-g-ink-3">
        Your data is private to you and never shared. Polaris is a companion, not a
        doctor, and never diagnoses. For medical concerns, please see a provider. 💗
      </p>
    </>
  )
}

function Stat({ emoji, value, label, tint }: { emoji: string; value: number; label: string; tint: string }) {
  return (
    <div className="rounded-3xl border border-g-border bg-white p-3 text-center shadow-girly">
      <span className={`mx-auto grid h-9 w-9 place-items-center rounded-2xl text-base ${tint}`}>{emoji}</span>
      <p className="mt-1.5 font-cute text-xl font-bold text-g-ink">{value}</p>
      <p className="text-[0.6rem] font-bold leading-tight text-g-ink-3">{label}</p>
    </div>
  )
}

function PostRow({ post }: { post: Post }) {
  const sn = subName(post.sub)
  return (
    <Link
      href={`/community/${post.id}`}
      className="block rounded-2xl border border-g-border bg-white p-3.5 shadow-girly active:scale-[0.99]"
    >
      <div className="flex items-center gap-2 text-xs font-bold text-g-ink-3">
        <span className="rounded-full bg-candy-soft px-2 py-0.5 text-g-ink">
          {sn.emoji} {sn.name}
        </span>
        <span>· {ago(post.created_at)}</span>
      </div>
      <p className="mt-1 font-cute text-base font-bold leading-snug text-g-ink">{post.title}</p>
      <div className="mt-1.5 flex items-center gap-3 text-xs font-bold text-g-ink-3">
        <span className={post.liked_by_me ? "" : "opacity-70"}>💗 {post.hearts}</span>
        <span>💬 {post.comment_count}</span>
      </div>
    </Link>
  )
}

function SettingRow({
  emoji,
  label,
  href,
  onClick,
  danger,
}: {
  emoji: string
  label: string
  href?: string
  onClick?: () => void
  danger?: boolean
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-g-border px-4 py-3.5 text-sm font-bold last:border-0 active:bg-g-canvas",
        danger ? "text-g-pink-deep" : "text-g-ink"
      )}
    >
      <span>{emoji}</span>
      <span className="flex-1">{label}</span>
      <span className="text-g-ink-3">›</span>
    </div>
  )
  return href ? (
    <Link href={href}>{inner}</Link>
  ) : (
    <button onClick={onClick} className="w-full text-left">
      {inner}
    </button>
  )
}

function Hero({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="animate-float text-3xl">{emoji}</span>
      <div>
        <h1 className="font-cute text-3xl font-bold text-g-ink">{title}</h1>
        <p className="text-sm font-semibold text-g-ink-3">{sub}</p>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 font-cute text-sm font-bold text-g-ink">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-g-border bg-white px-4 py-3.5 text-sm font-semibold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
    </label>
  )
}
