"use client"

import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import { toDateKey } from "@/lib/tracker"
import {
  LAB_GROUPS,
  addLab,
  getLabPhotos,
  getLabs,
  labDef,
  removeLab,
  removeLabPhoto,
  signedUrlFor,
  uploadLabPhoto,
  type LabDef,
  type LabEntry,
  type LabPhoto,
} from "@/lib/labs"

export default function LabsPage() {
  const { user } = useAuth()
  const [labs, setLabs] = useState<LabEntry[]>([])
  const [photos, setPhotos] = useState<LabPhoto[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLabs(getLabs())
    setPhotos(getLabPhotos())
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

  async function onPhoto(file: File | null) {
    if (!file || !user) return
    setBusy(true)
    setError(null)
    const r = await uploadLabPhoto(file, user)
    setBusy(false)
    if (r.error) setError(r.error)
    else setPhotos(getLabPhotos())
  }

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">🧪</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">My labs</h1>
          <p className="text-sm font-semibold text-g-ink-3">Your bloodwork, all in one place 💕</p>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">
        Copy values from your own lab report (it has the reference range for you). These go into your visit summary.
        MyPMOS never decides what&apos;s &ldquo;normal&rdquo; — that&apos;s your doctor&apos;s call.
      </p>

      {/* Add a value */}
      {picking ? (
        <AddLab
          onAdded={() => {
            setLabs(getLabs())
            setPicking(false)
          }}
          onCancel={() => setPicking(false)}
        />
      ) : (
        <button
          onClick={() => setPicking(true)}
          className="mt-3 w-full rounded-2xl border border-dashed border-g-pink bg-white px-4 py-3.5 text-sm font-bold text-g-pink-deep active:scale-[0.99]"
        >
          ＋ Add a lab value
        </button>
      )}

      {/* Values */}
      {labs.length > 0 && (
        <section className="mt-5">
          <h2 className="px-1 font-cute text-base font-bold text-g-ink">Your values</h2>
          <div className="mt-2 space-y-2">
            {labs.map((l) => {
              const def = labDef(l.labId)
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-2xl border border-g-border bg-white p-3.5 shadow-girly">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-g-ink">{def?.label ?? l.labId}</p>
                    <p className="text-xs font-semibold text-g-ink-3">
                      {l.date}
                      {l.note ? ` · ${l.note}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-cute text-base font-bold text-g-pink-deep">
                    {l.value} <span className="text-xs font-bold text-g-ink-3">{l.unit}</span>
                  </span>
                  <button
                    onClick={() => setLabs(removeLab(l.id))}
                    className="shrink-0 text-xs font-bold text-g-ink-3 active:scale-90"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Report photos */}
      <section className="mt-6">
        <h2 className="px-1 font-cute text-base font-bold text-g-ink">Report photos</h2>
        {user ? (
          <>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-candy-soft px-3.5 py-2 text-sm font-bold text-g-pink-deep active:scale-95">
              {busy ? "Uploading…" : "📷 Add a photo of a lab report"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
            </label>
            <p className="mt-1 px-1 text-[0.7rem] font-semibold text-g-ink-3">Private to you. Stored securely, never shared.</p>
            {error && <p className="mt-1 px-1 text-xs font-bold text-g-pink-deep">{error}</p>}
            {photos.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative overflow-hidden rounded-2xl border border-g-border bg-g-canvas">
                    {urls[p.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urls[p.id]} alt="Lab report" className="h-36 w-full object-cover" />
                    ) : (
                      <div className="grid h-36 w-full place-items-center text-g-ink-3">🧪</div>
                    )}
                    <button
                      onClick={async () => setPhotos(await removeLabPhoto(p.id))}
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
          <p className="mt-2 rounded-2xl border border-g-border bg-white px-4 py-3 text-sm font-semibold text-g-ink-2 shadow-girly">
            Sign in to attach private photos of your lab reports.
          </p>
        )}
      </section>

      <p className="mt-6 px-2 text-center text-xs font-semibold text-g-ink-3">
        MyPMOS is a companion, not a doctor, and never interprets results. 💗
      </p>
    </PatientShell>
  )
}

function AddLab({ onAdded, onCancel }: { onAdded: () => void; onCancel: () => void }) {
  const [selected, setSelected] = useState<LabDef | null>(null)
  const [value, setValue] = useState("")
  const [unit, setUnit] = useState("")
  const [date, setDate] = useState(toDateKey(new Date()))
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  function choose(l: LabDef) {
    setSelected(l)
    setUnit(l.unit)
  }

  function save() {
    if (!selected) return
    const r = addLab({ labId: selected.id, value, unit, date, note })
    if (r.error) {
      setError(r.error)
      return
    }
    onAdded()
  }

  return (
    <div className="mt-3 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      {!selected ? (
        <>
          <p className="font-cute text-sm font-bold text-g-ink">Which test?</p>
          <div className="mt-2 space-y-3">
            {LAB_GROUPS.map((g) => (
              <div key={g.id}>
                <p className="px-1 text-xs font-bold text-g-ink-3">
                  {g.emoji} {g.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {g.labs.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => choose(l)}
                      className="rounded-full border border-g-border bg-g-canvas px-3 py-1.5 text-xs font-bold text-g-ink-2 active:scale-95"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={onCancel} className="mt-3 text-xs font-bold text-g-ink-3 active:scale-95">
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="font-cute text-base font-bold text-g-ink">{selected.label}</p>
            <button onClick={() => setSelected(null)} className="text-xs font-bold text-g-ink-3 active:scale-95">
              Change
            </button>
          </div>
          <p className="mt-0.5 text-xs font-medium text-g-ink-2">{selected.about}</p>
          <div className="mt-2 flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="decimal"
              placeholder="Value"
              className="min-w-0 flex-1 rounded-2xl border border-g-border bg-g-canvas px-4 py-3 font-cute text-base font-bold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
            />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit"
              className="w-24 rounded-2xl border border-g-border bg-g-canvas px-3 py-3 text-sm font-bold text-g-ink-2 outline-none focus:border-g-pink"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none focus:border-g-pink"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
          />
          {error && <p className="mt-2 text-xs font-bold text-g-pink-deep">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={save} className="rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95">
              Save value
            </button>
            <button onClick={onCancel} className="rounded-full border border-g-border bg-white px-5 py-2.5 text-sm font-bold text-g-ink-2 active:scale-95">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
