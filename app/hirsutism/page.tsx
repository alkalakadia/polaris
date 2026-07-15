"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import { toDateKey } from "@/lib/tracker"
import { signedUrlFor } from "@/lib/labs"
import { FG_AREAS } from "@/lib/assessments"
import {
  getHirsutismPhotos,
  getShaveDays,
  isShaveDay,
  removeHirsutismPhoto,
  shaveStats,
  toggleShaveDay,
  uploadHirsutismPhoto,
  type HirsutismPhoto,
} from "@/lib/hirsutism"

export default function HirsutismPage() {
  const { user } = useAuth()
  const [, setShaves] = useState<string[]>([])
  const [stats, setStats] = useState(shaveStats())
  const [photos, setPhotos] = useState<HirsutismPhoto[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const PHOTO_AREAS = [...FG_AREAS.map((a) => a.label), "Acne (face)", "Acne (body)", "Skin", "Other"]
  const [area, setArea] = useState<string>(PHOTO_AREAS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setShaves(getShaveDays())
    setStats(shaveStats())
    setPhotos(getHirsutismPhotos())
  }, [])

  useEffect(() => {
    let live = true
    ;(async () => {
      const out: Record<string, string> = {}
      for (const p of photos) {
        const u = await signedUrlFor(p.path)
        if (u) out[p.id] = u
      }
      if (live) setUrls(out)
    })()
    return () => {
      live = false
    }
  }, [photos])

  const todayShaved = isShaveDay(toDateKey(new Date()))

  function markShave() {
    setShaves(toggleShaveDay())
    setStats(shaveStats())
  }

  async function onPhoto(file: File | null) {
    if (!file || !user) return
    setBusy(true)
    setError(null)
    const r = await uploadHirsutismPhoto(file, user, area)
    setBusy(false)
    if (r.error) setError(r.error)
    else setPhotos(getHirsutismPhotos())
  }

  // last 14 days strip
  const strip = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const key = toDateKey(d)
    return { key, shaved: isShaveDay(key) }
  })

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">🪶</span>
        <div>
          <h1 className="font-cute text-2xl text-g-ink">Symptom photos</h1>
          <p className="text-sm font-medium text-g-ink-3">Track hair, skin & acne changes over time 💕</p>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">
        Tip: longer gaps between shaving or waxing over time can be a sign that treatment is helping. No pressure,
        just track what you notice.
      </p>

      {/* Shaving cadence */}
      <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
        <p className="font-cute text-base font-bold text-g-ink">Hair-removal cadence</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Stat label="Every" value={stats.averageInterval != null ? `${stats.averageInterval}d` : "—"} />
          <Stat label="Last" value={stats.daysSinceLast != null ? `${stats.daysSinceLast}d ago` : "—"} />
          <Stat label="Logged" value={`${stats.count}`} />
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          {strip.map((d, i) => (
            <span
              key={i}
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-[0.7rem] font-bold",
                d.shaved ? "bg-candy text-white" : "bg-g-canvas text-g-ink-3"
              )}
              title={d.key}
            >
              {d.shaved ? "🪒" : ""}
            </span>
          ))}
        </div>

        <button
          onClick={markShave}
          className={cn(
            "mt-3 w-full rounded-full py-3 font-cute text-base font-bold transition active:scale-[0.98]",
            todayShaved ? "bg-candy-soft text-g-pink-deep" : "bg-candy text-white shadow-girly-pop"
          )}
        >
          {todayShaved ? "✓ Marked for today" : "I shaved / waxed today"}
        </button>
      </section>

      {/* Photo timeline */}
      <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
        <p className="font-cute text-base font-bold text-g-ink">Photo timeline</p>
        <p className="mt-0.5 text-xs font-medium text-g-ink-2">
          Dated, private photos of one area so you can compare over months. Stored securely, never shared.
        </p>

        {user ? (
          <>
            <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
              {PHOTO_AREAS.map((a) => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95",
                    area === a ? "border-transparent bg-candy text-white" : "border-g-border bg-g-canvas text-g-ink-2"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-candy-soft px-3.5 py-2 text-sm font-bold text-g-pink-deep active:scale-95">
              {busy ? "Uploading…" : `📷 Add a photo (${area})`}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
            </label>
            {error && <p className="mt-1 text-xs font-bold text-g-pink-deep">{error}</p>}

            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative overflow-hidden rounded-2xl border border-g-border bg-g-canvas">
                    {urls[p.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urls[p.id]} alt="Hair tracking" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="grid h-40 w-full place-items-center text-g-ink-3">🪶</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1 text-[0.7rem] font-bold text-white">
                      {p.area ?? "Area"} · {p.date}
                    </div>
                    <button
                      onClick={async () => setPhotos(await removeHirsutismPhoto(p.id))}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-xs font-bold text-g-ink shadow"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 rounded-2xl border border-g-border bg-white px-4 py-3 text-sm font-semibold text-g-ink-2">
            Sign in to add private photos.
          </p>
        )}
      </section>

      <Link
        href="/assessments"
        className="mt-4 flex items-center justify-between rounded-2xl border border-g-border bg-white px-4 py-3 text-sm font-bold text-g-ink shadow-girly active:scale-[0.99]"
      >
        <span>🧴 Do the Ferriman-Gallwey hair self-score</span>
        <span className="text-g-ink-3">›</span>
      </Link>

      <p className="mt-5 px-2 text-center text-xs font-semibold text-g-ink-3">
        MyPMOS is a companion, not a doctor, and never diagnoses. 💗
      </p>
    </PatientShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-candy-soft px-2 py-2.5">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-g-ink-3">{label}</p>
      <p className="font-cute text-lg font-bold text-g-ink">{value}</p>
    </div>
  )
}
