"use client"

import { useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import {
  mergeIntoTracker,
  parseAppleHealth,
  parseCsv,
  saveTodayMetrics,
  type DayMetrics,
} from "@/lib/health-import"

const MAX_FILE_MB = 80

export default function ImportPage() {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // manual quick-entry
  const [steps, setSteps] = useState("")
  const [restingHr, setRestingHr] = useState("")
  const [activeMin, setActiveMin] = useState("")
  const [kcal, setKcal] = useState("")
  const [sleepHours, setSleepHours] = useState("")
  const [savedToday, setSavedToday] = useState(false)

  async function onFile(file: File | null) {
    if (!file) return
    setError(null)
    setStatus(null)
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`That file is over ${MAX_FILE_MB}MB. Try exporting a shorter date range, or use a CSV.`)
      return
    }
    setBusy(true)
    try {
      const text = await file.text()
      const isXml = file.name.toLowerCase().endsWith(".xml") || text.trimStart().startsWith("<?xml") || text.includes("<HealthData")
      const days = isXml ? parseAppleHealth(text) : parseCsv(text)
      const dayCount = Object.keys(days).length
      if (dayCount === 0) {
        setError("Couldn't find any recognizable data in that file. For CSV, include a 'date' column.")
        setBusy(false)
        return
      }
      const { imported, fields } = await mergeIntoTracker(days)
      setStatus(`Imported ${fields} value${fields === 1 ? "" : "s"} across ${imported} day${imported === 1 ? "" : "s"}. 🎉`)
    } catch {
      setError("Something went wrong reading that file. Try a smaller export or a CSV.")
    }
    setBusy(false)
  }

  async function saveToday() {
    const m: DayMetrics = {}
    const num = (s: string) => (s.trim() ? parseFloat(s) : NaN)
    if (Number.isFinite(num(steps))) m.steps = num(steps)
    if (Number.isFinite(num(restingHr))) m.restingHr = num(restingHr)
    if (Number.isFinite(num(activeMin))) m.activeMin = num(activeMin)
    if (Number.isFinite(num(kcal))) m.kcal = num(kcal)
    if (Number.isFinite(num(sleepHours))) m.sleepHours = num(sleepHours)
    if (Object.keys(m).length === 0) return
    await saveTodayMetrics(m)
    setSavedToday(true)
    setSteps("")
    setRestingHr("")
    setActiveMin("")
    setKcal("")
    setSleepHours("")
    setTimeout(() => setSavedToday(false), 2500)
  }

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">⌚️</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Activity & import</h1>
          <p className="text-sm font-semibold text-g-ink-3">Steps, sleep, heart rate & more 💕</p>
        </div>
      </div>

      {/* Quick manual entry */}
      <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
        <p className="font-cute text-base font-bold text-g-ink">Today&apos;s numbers</p>
        <p className="mt-0.5 text-xs font-semibold text-g-ink-3">Pop in whatever you have, leave the rest blank.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Steps" value={steps} onChange={setSteps} placeholder="8000" />
          <Field label="Resting HR (bpm)" value={restingHr} onChange={setRestingHr} placeholder="64" />
          <Field label="Active minutes" value={activeMin} onChange={setActiveMin} placeholder="30" />
          <Field label="Calories (kcal)" value={kcal} onChange={setKcal} placeholder="1800" />
          <Field label="Sleep (hours)" value={sleepHours} onChange={setSleepHours} placeholder="7.5" />
        </div>
        <button
          onClick={saveToday}
          className="mt-3 w-full rounded-full bg-candy py-3 font-cute text-base font-bold text-white shadow-girly-pop active:scale-[0.98]"
        >
          {savedToday ? "Saved 💗" : "Save today"}
        </button>
      </section>

      {/* File import */}
      <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
        <p className="font-cute text-base font-bold text-g-ink">Import from Apple Health or a CSV</p>
        <p className="mt-1 text-xs font-medium text-g-ink-2">
          Apps can&apos;t read Apple Health or Google Fit live (that needs a phone app). But you can export your data
          and bring it in here. We only fill in steps, sleep, weight, heart rate, and calories, your hand-logged
          entries stay untouched.
        </p>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-pink-deep active:scale-95">
          {busy ? "Reading…" : "📤 Choose export.xml or .csv"}
          <input type="file" accept=".xml,.csv,text/csv,text/xml" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </label>

        {status && <p className="mt-2 rounded-2xl bg-g-mint-soft px-3 py-2 text-sm font-bold text-g-ink">{status}</p>}
        {error && <p className="mt-2 text-sm font-bold text-g-pink-deep">{error}</p>}

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-g-pink-deep">How do I export from Apple Health?</summary>
          <p className="mt-1.5 text-xs font-medium text-g-ink-2">
            On your iPhone: open the <b>Health</b> app → tap your <b>profile picture</b> (top right) → scroll down to{" "}
            <b>Export All Health Data</b>. You&apos;ll get a zip; unzip it and upload the <b>export.xml</b> inside. Big
            histories can be large, so a recent range works best.
          </p>
        </details>
        <p className="mt-2 text-[0.7rem] font-semibold text-g-ink-3">
          CSV works too: a <b>date</b> column plus any of steps, weightKg, restingHr, sleepHours, kcal, activeMin.
        </p>
      </section>

      <p className="mt-5 px-2 text-center text-xs font-semibold text-g-ink-3">
        Your data stays yours. Imported numbers help spot patterns; they&apos;re never a diagnosis. 💗
      </p>
    </PatientShell>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="px-1 text-[0.7rem] font-bold text-g-ink-3">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className="mt-0.5 w-full rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 text-sm font-bold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
    </label>
  )
}
