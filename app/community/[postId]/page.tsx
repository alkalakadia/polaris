"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { useAuth } from "@/lib/auth"
import {
  addComment,
  ago,
  deleteComment,
  deletePost,
  getPost,
  isEditable,
  listComments,
  reportContent,
  subName,
  toggleBlock,
  toggleLike,
  updatePost,
  type Comment,
  type Post,
} from "@/lib/community"
import { PostMediaView } from "@/components/post-media"

export default function PostDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ postId: string }>()
  const postId = params.postId

  const [post, setPost] = useState<Post | null | "missing">(null)
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")

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

  function startEdit() {
    if (!post || post === "missing") return
    setEditTitle(post.title)
    setEditBody(post.body ?? "")
    setEditing(true)
  }
  async function saveEdit() {
    if (!user || !post || post === "missing" || !editTitle.trim()) return
    setBusy(true)
    const res = await updatePost(post.id, { title: editTitle, body: editBody }, user)
    setBusy(false)
    if (!res.error) {
      setEditing(false)
      await load()
    }
  }
  async function removePost() {
    if (!user || !post || post === "missing") return
    if (!window.confirm("Delete this post? This can't be undone.")) return
    await deletePost(post.id, user)
    router.push("/community")
  }
  async function removeComment(id: string) {
    if (!user) return
    if (!window.confirm("Delete this reply?")) return
    await deleteComment(id, user)
    setComments(await listComments(postId))
    const p = await getPost(postId)
    if (p) setPost(p)
  }
  async function report(target: { postId?: string; commentId?: string }) {
    if (!user) return router.push("/account")
    const reason = window.prompt("What's wrong with this? (optional) e.g. spam, misinformation, harassment")
    if (reason === null) return
    await reportContent({ ...target, reason: reason || "unspecified" }, user)
    window.alert("Thanks for flagging this. We'll review it.")
  }
  function blockAuthor(uid: string) {
    if (!window.confirm("Block this person? You won't see their posts or replies anymore.")) return
    toggleBlock(uid)
    router.push("/community")
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

            {editing ? (
              <div className="mt-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 font-cute text-base font-bold text-g-ink outline-none focus:border-g-pink"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none focus:border-g-pink"
                />
                <div className="mt-2 flex gap-2">
                  <button onClick={saveEdit} disabled={busy || !editTitle.trim()} className="rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-50">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="rounded-full border border-g-border bg-white px-5 py-2.5 text-sm font-bold text-g-ink-2 active:scale-95">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="mt-2 font-cute text-2xl font-bold leading-snug text-g-ink">{post.title}</h1>
                {post.body && <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-g-ink-2">{post.body}</p>}
                <PostMediaView media={post.media} />
              </>
            )}

            <div className="mt-4 flex items-center gap-4 text-sm font-bold text-g-ink-3">
              <button onClick={onLike} className="inline-flex items-center gap-1.5 active:scale-90">
                <span className={post.liked_by_me ? "" : "grayscale"}>💗</span> {post.hearts}
              </button>
              <span className="inline-flex items-center gap-1.5">💬 {post.comment_count}</span>
              {user && post.user_id === user.id && !editing && (
                <span className="ml-auto flex items-center gap-3">
                  {isEditable(post.created_at) && (
                    <button onClick={startEdit} className="text-g-ink-3 active:scale-95">✏️ Edit</button>
                  )}
                  <button onClick={removePost} className="text-g-pink-deep active:scale-95">🗑 Delete</button>
                </span>
              )}
              {user && post.user_id !== user.id && !editing && (
                <span className="ml-auto flex items-center gap-3">
                  <button onClick={() => report({ postId: post.id })} className="text-g-ink-3 active:scale-95">⚠️ Report</button>
                  <button onClick={() => blockAuthor(post.user_id)} className="text-g-pink-deep active:scale-95">🚫 Block</button>
                </span>
              )}
            </div>
            {user && post.user_id === user.id && !isEditable(post.created_at) && !editing && (
              <p className="mt-1.5 text-[0.7rem] font-semibold text-g-ink-3">Posts can be edited for 1 hour after posting.</p>
            )}
          </article>

          {/* Comments */}
          <h2 className="mt-6 px-1 font-cute text-base font-bold text-g-ink">
            Replies {comments ? `(${comments.length})` : ""}
          </h2>
          <div className="mt-2 space-y-2.5">
            {comments?.map((c) => (
              <div key={c.id} className="rounded-2xl border border-g-border bg-white p-3.5 shadow-girly">
                <div className="flex items-center text-xs font-bold text-g-ink-3">
                  <span>@{c.author_name} · {ago(c.created_at)}</span>
                  {user && c.user_id === user.id && (
                    <button onClick={() => removeComment(c.id)} className="ml-auto text-g-pink-deep active:scale-90" aria-label="Delete reply">
                      🗑
                    </button>
                  )}
                  {user && c.user_id !== user.id && (
                    <button onClick={() => report({ commentId: c.id })} className="ml-auto text-g-ink-3 active:scale-90" aria-label="Report reply">
                      ⚠️
                    </button>
                  )}
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
