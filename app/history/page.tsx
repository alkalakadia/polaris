"use client"

import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import { toDateKey } from "@/lib/tracker"
import {
  CONCERNS,
  CONTRA_TYPES,
  addContra,
  contraSummary,
  getHistory,
  removeContra,
  setMainConcern,
  type ContraEntry,
  type HistoryData,
} from "@/lib/history"

export default function HistoryPage() {
  const [h, setH] = useState<HistoryData>({ contraception: [] })
  const [adding, setAdding] = useState(false)
  const [concernNote, setConcernNote] = useState("")

  useEffect(() => {
    const data = getHistory()
    setH(data)
    setConcernNote(data.mainConcern?.note ?? "")
  }, [])

  function chooseConcern(id: string) {
    setH(setMainConcern(id, concernNote))
  }
  function saveConcernNote() {
    if (h.mainConcern) setH(setMainConcern(h.mainConcern.id, concernNote))
  }

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">🗂️</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">My history</h1>
          <p className="text-sm font-semibold text-g-ink-3">What matters to you + your birth control 💕</p>
        </div>
      </div>

      {/* Main concern */}
      <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
        <p className="font-cute text-base font-bold text-g-ink">What&apos;s your main concern right now?</p>
        <p className="mt-0.5 text-xs font-semibold text-g-ink-3">This helps focus everything, and helps your doctor.</p>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {CONCERNS.map((c) => (
            <button
              key={c.id}
              onClick={() => chooseConcern(c.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left text-sm font-bold transition active:scale-[0.99]",
                h.mainConcern?.id === c.id ? "border-transparent bg-candy text-white" : "border-g-border bg-white text-g-ink"
              )}
            >
              <span className="text-lg">{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        {h.mainConcern && (
          <input
            value={concernNote}
            onChange={(e) => setConcernNote(e.target.value)}
            onBlur={saveConcernNote}
            placeholder="Anything to add? (optional)"
            className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
          />
        )}
      </section>

      {/* Birth control timeline */}
      <section className="mt-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-cute text-base font-bold text-g-ink">Birth control history 💊</h2>
          {!adding && (
            <button onClick={() => setAdding(true)} className="rounded-full bg-candy px-3.5 py-1.5 text-xs font-bold text-white active:scale-95">
              + Add
            </button>
          )}
        </div>
        <p className="mt-1 px-1 text-xs font-semibold text-g-ink-3">
          Symptoms can look very different on vs off birth control, so this really helps your doctor read your cycle.
        </p>

        {adding && (
          <AddContra
            onAdded={(data) => {
              setH(data)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        )}

        <div className="mt-2 space-y-2">
          {h.contraception.map((c) => (
            <div key={c.id} className="rounded-2xl border border-g-border bg-white p-3.5 shadow-girly">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-g-ink">{contraSummary(c)}</p>
                <button onClick={() => setH(removeContra(c.id))} className="shrink-0 text-xs font-bold text-g-ink-3 active:scale-90" aria-label="Remove">
                  ✕
                </button>
              </div>
              {c.current && <span className="mt-1 inline-block rounded-full bg-g-mint-soft px-2 py-0.5 text-[0.65rem] font-bold text-g-ink">Currently using</span>}
              {c.note && <p className="mt-1 text-xs font-medium text-g-ink-2">{c.note}</p>}
            </div>
          ))}
          {h.contraception.length === 0 && !adding && (
            <p className="rounded-2xl bg-candy-soft px-4 py-3 text-sm font-bold text-g-ink">Add any birth control you use now or used before, even &ldquo;none.&rdquo;</p>
          )}
        </div>
      </section>

      <p className="mt-5 px-2 text-center text-xs font-semibold text-g-ink-3">
        Private to you. Flows into your visit summary so you don&apos;t have to remember it all. 💗
      </p>
    </PatientShell>
  )
}

function AddContra({ onAdded, onCancel }: { onAdded: (h: HistoryData) => void; onCancel: () => void }) {
  const [type, setType] = useState(CONTRA_TYPES[0].id)
  const [current, setCurrent] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")

  function add() {
    const entry: Omit<ContraEntry, "id" | "createdAt"> = {
      type,
      current,
      startDate: startDate || undefined,
      endDate: current ? undefined : endDate || undefined,
      reason: reason.trim() || undefined,
      note: note.trim() || undefined,
    }
    onAdded(addContra(entry))
  }

  return (
    <div className="mt-2 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <p className="font-cute text-sm font-bold text-g-ink">Add birth control</p>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-bold text-g-ink outline-none focus:border-g-pink"
      >
        {CONTRA_TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>

      <label className="mt-2 flex items-center gap-2 px-1 text-sm font-bold text-g-ink">
        <input type="checkbox" checked={current} onChange={(e) => setCurrent(e.target.checked)} />
        I&apos;m using this now
      </label>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="px-1 text-[0.7rem] font-bold text-g-ink-3">Started</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-0.5 w-full rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 text-sm font-medium text-g-ink outline-none focus:border-g-pink" />
        </label>
        {!current && (
          <label className="block">
            <span className="px-1 text-[0.7rem] font-bold text-g-ink-3">Stopped</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-0.5 w-full rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 text-sm font-medium text-g-ink outline-none focus:border-g-pink" />
          </label>
        )}
      </div>

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why did you start it? (e.g. acne, cramps, pregnancy prevention)"
        className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="How did it affect you? (optional)"
        className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
      <div className="mt-3 flex gap-2">
        <button onClick={add} className="rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95">
          Save
        </button>
        <button onClick={onCancel} className="rounded-full border border-g-border bg-white px-5 py-2.5 text-sm font-bold text-g-ink-2 active:scale-95">
          Cancel
        </button>
      </div>
      <button onClick={() => setStartDate(toDateKey(new Date()))} className="mt-2 text-[0.7rem] font-bold text-g-pink-deep active:scale-95">
        Started today
      </button>
    </div>
  )
}
