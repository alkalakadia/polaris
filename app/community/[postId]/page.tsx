"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { useAuth } from "@/lib/auth"
import {
  addComment,
  ago,
  getPost,
  listComments,
  subName,
  toggleLike,
  type Comment,
  type Post,
} from "@/lib/community"

export default function PostDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ postId: string }>()
  const postId = params.postId

  const [post, setPost] = useState<Post | null | "missing">(null)
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const p = await getPost(postId)
    setPost(p ?? "missing")
    setComments(await listComments(postId))
  }, [postId])

  useEffect(() => {
    load()
  }, [load, user])

  async function onLike() {
    if (!user) return router.push("/account")
    if (!post || post === "missing") return
    setPost({ ...post, liked_by_me: !post.liked_by_me, hearts: post.hearts + (post.liked_by_me ? -1 : 1) })
    await toggleLike(post.id, user)
  }

  async function send() {
    if (!user) return router.push("/account")
    if (!draft.trim()) return
    setBusy(true)
    await addComment(postId, draft, user)
    setDraft("")
    setBusy(false)
    setComments(await listComments(postId))
    // refresh count on the post
    const p = await getPost(postId)
    if (p) setPost(p)
  }

  return (
    <PatientShell>
      <Link href="/community" className="text-sm font-bold text-g-ink-3 active:scale-95">
        ← Back to community
      </Link>

      {post === null ? (
        <div className="mt-4 h-32 animate-pulse rounded-3xl bg-white/70" />
      ) : post === "missing" ? (
        <div className="mt-6 rounded-3xl border border-g-border bg-white p-6 text-center shadow-girly">
          <span className="text-4xl">🌸</span>
          <p className="mt-3 font-cute text-lg font-bold text-g-ink">This post is gone</p>
          <Link href="/community" className="mt-3 inline-block rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white">
            Back to community
          </Link>
        </div>
      ) : (
        <>
          <article className="mt-4 rounded-3xl border border-g-border bg-white p-5 shadow-girly">
            <div className="flex items-center gap-2 text-xs font-bold text-g-ink-3">
              <span className="rounded-full bg-candy-soft px-2.5 py-1 text-g-ink">
                {subName(post.sub).emoji} {subName(post.sub).name}
              </span>
              <span>@{post.author_name}</span>
              <span>· {ago(post.created_at)}</span>
            </div>
            <h1 className="mt-2 font-cute text-2xl font-bold leading-snug text-g-ink">{post.title}</h1>
            {post.body && <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-g-ink-2">{post.body}</p>}
            <div className="mt-4 flex items-center gap-4 text-sm font-bold text-g-ink-3">
              <button onClick={onLike} className="inline-flex items-center gap-1.5 active:scale-90">
                <span className={post.liked_by_me ? "" : "grayscale"}>💗</span> {post.hearts}
              </button>
              <span className="inline-flex items-center gap-1.5">💬 {post.comment_count}</span>
            </div>
          </article>

          {/* Comments */}
          <h2 className="mt-6 px-1 font-cute text-base font-bold text-g-ink">
            Replies {comments ? `(${comments.length})` : ""}
          </h2>
          <div className="mt-2 space-y-2.5">
            {comments?.map((c) => (
              <div key={c.id} className="rounded-2xl border border-g-border bg-white p-3.5 shadow-girly">
                <div className="text-xs font-bold text-g-ink-3">
                  @{c.author_name} · {ago(c.created_at)}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-g-ink">{c.body}</p>
              </div>
            ))}
            {comments && comments.length === 0 && (
              <p className="rounded-2xl bg-candy-soft px-4 py-3 text-sm font-bold text-g-ink">
                No replies yet — be the first to send some love 💗
              </p>
            )}
          </div>

          {/* Composer */}
          <div className="mt-4 flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder={user ? "Add a kind reply…" : "Sign in to reply"}
              onFocus={() => !user && router.push("/account")}
              className="flex-1 resize-none rounded-2xl border border-g-border bg-white px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
            />
            <button
              onClick={send}
              disabled={busy || !draft.trim()}
              className="rounded-2xl bg-candy px-5 py-3 text-sm font-bold text-white shadow-girly-pop active:scale-95 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </>
      )}
    </PatientShell>
  )
}
