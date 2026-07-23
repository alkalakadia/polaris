"use client"

import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { useAuth } from "@/lib/auth"
import { browserClient } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { user, loading, updatePassword } = useAuth()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [reveal, setReveal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // The reset link puts a recovery session in the URL; Supabase's client
  // picks it up on load and fires an auth event once ready.
  useEffect(() => {
    const c = browserClient()
    if (!c) return
    const { data: sub } = c.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setError("Password must be at least 6 characters.")
    if (password !== confirm) return setError("Passwords don't match.")
    setBusy(true)
    setError(null)
    const res = await updatePassword(password)
    setBusy(false)
    if (res.error) setError(res.error)
    else setDone(true)
  }

  if (done) {
    return (
      <PatientShell>
        <div className="flex items-center gap-2">
          <span className="animate-float text-3xl">🎉</span>
          <div>
            <h1 className="font-cute text-3xl font-bold text-g-ink">Password updated</h1>
            <p className="text-sm font-semibold text-g-ink-3">You&apos;re all set</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl border border-g-border bg-white p-6 text-center shadow-girly">
          <span className="text-4xl">✅</span>
          <p className="mt-3 font-cute text-lg font-bold text-g-ink">Your password was changed</p>
          <button
            onClick={() => router.replace("/account")}
            className="mt-4 rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95"
          >
            Go to my account
          </button>
        </div>
      </PatientShell>
    )
  }

  if (!loading && !user && !ready) {
    return (
      <PatientShell>
        <div className="flex items-center gap-2">
          <span className="animate-float text-3xl">🔑</span>
          <div>
            <h1 className="font-cute text-3xl font-bold text-g-ink">Reset link needed</h1>
            <p className="text-sm font-semibold text-g-ink-3">This page only works from the emailed link</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl border border-g-border bg-white p-6 text-center shadow-girly">
          <span className="text-4xl">📪</span>
          <p className="mt-3 font-cute text-lg font-bold text-g-ink">Open the link from your email</p>
          <p className="mt-1 text-sm font-semibold text-g-ink-2">
            Request a new one from the sign-in page if it expired.
          </p>
          <button
            onClick={() => router.replace("/account")}
            className="mt-4 rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95"
          >
            Back to sign in
          </button>
        </div>
      </PatientShell>
    )
  }

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">🔑</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Choose a new password</h1>
          <p className="text-sm font-semibold text-g-ink-3">Make it something you&apos;ll remember</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1.5 block px-1 font-cute text-sm font-bold text-g-ink">New password</span>
          <div className="relative">
            <input
              type={reveal ? "text" : "password"}
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-g-border bg-white px-4 py-3.5 pr-11 text-sm font-semibold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-g-ink-3 active:scale-90"
            >
              {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block px-1 font-cute text-sm font-bold text-g-ink">Confirm password</span>
          <input
            type={reveal ? "text" : "password"}
            value={confirm}
            required
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-g-border bg-white px-4 py-3.5 text-sm font-semibold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
          />
        </label>

        {error && (
          <p className="rounded-2xl bg-g-pink-soft px-4 py-3 text-sm font-bold text-g-pink-deep">
            💔 {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-candy py-4 font-cute text-lg font-bold text-white shadow-girly-pop transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "One sec…" : "Update password"}
        </button>
      </form>
    </PatientShell>
  )
}
