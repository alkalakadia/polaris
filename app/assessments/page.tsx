"use client"

import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import {
  FG_AREAS,
  FG_ETHNICITY,
  FG_LEVELS,
  SCREENERS,
  SEVERITY_4,
  bandFor,
  fgCutoff,
  fgTotal,
  getAllResults,
  getResult,
  saveResult,
  screenerById,
  type AssessmentId,
  type AssessmentResult,
  type Screener,
} from "@/lib/assessments"

type View = "hub" | AssessmentId

export default function AssessmentsPage() {
  const [view, setView] = useState<View>("hub")
  const [results, setResults] = useState<Partial<Record<AssessmentId, AssessmentResult>>>({})

  useEffect(() => {
    setResults(getAllResults())
  }, [])

  const refresh = () => {
    setResults(getAllResults())
    setView("hub")
  }

  if (view === "fg") return <FGRunner onDone={refresh} onCancel={() => setView("hub")} />
  if (view === "acne") return <SeverityRunner id="acne" title="Acne severity" emoji="🌸" onDone={refresh} onCancel={() => setView("hub")} />
  if (view === "hairloss") return <SeverityRunner id="hairloss" title="Scalp hair loss / thinning" emoji="💇" onDone={refresh} onCancel={() => setView("hub")} />
  const s = screenerById(view as AssessmentId)
  if (s) return <ScreenerRunner screener={s} onDone={refresh} onCancel={() => setView("hub")} />

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">📋</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Check-ins</h1>
          <p className="text-sm font-semibold text-g-ink-3">Quick, private self-checks your doctor will recognize 💕</p>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">
        These are standard screening tools, not diagnoses. Your scores go into your visit summary so you and your
        doctor can talk about them.
      </p>

      <h2 className="mt-5 px-1 font-cute text-base font-bold text-g-ink">Hyperandrogenism signs</h2>
      <div className="mt-2 space-y-2.5">
        <HubCard
          emoji="🧴"
          title="Hair growth (Ferriman-Gallwey)"
          sub="Self-score unwanted hair across 9 areas"
          result={results.fg}
          onOpen={() => setView("fg")}
        />
        <HubCard emoji="🌸" title="Acne severity" sub="None to severe" result={results.acne} onOpen={() => setView("acne")} />
        <HubCard emoji="💇" title="Scalp hair loss" sub="Thinning at the crown / hairline" result={results.hairloss} onOpen={() => setView("hairloss")} />
      </div>

      <h2 className="mt-6 px-1 font-cute text-base font-bold text-g-ink">Wellbeing & sleep</h2>
      <div className="mt-2 space-y-2.5">
        {SCREENERS.map((sc) => (
          <HubCard
            key={sc.id}
            emoji={sc.emoji}
            title={sc.name}
            sub={sc.intro}
            result={results[sc.id]}
            onOpen={() => setView(sc.id)}
          />
        ))}
      </div>

      <p className="mt-6 px-2 text-center text-xs font-semibold text-g-ink-3">
        MyPMOS is a companion, not a doctor, and never diagnoses. 💗
      </p>
    </PatientShell>
  )
}

function HubCard({
  emoji,
  title,
  sub,
  result,
  onOpen,
}: {
  emoji: string
  title: string
  sub: string
  result?: AssessmentResult
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-3xl border border-g-border bg-white p-3.5 text-left shadow-girly active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-candy-soft text-lg">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="font-cute text-sm font-bold leading-snug text-g-ink">{title}</p>
        <p className="line-clamp-1 text-xs font-medium text-g-ink-2">{sub}</p>
      </div>
      {result ? (
        <span className="shrink-0 rounded-full bg-g-mint-soft px-2.5 py-1 text-[0.7rem] font-bold text-g-ink">
          {result.band ? result.band : `Score ${result.score}`}
        </span>
      ) : (
        <span className="shrink-0 text-g-ink-3">›</span>
      )}
    </button>
  )
}

function RunnerShell({
  title,
  emoji,
  children,
  onCancel,
}: {
  title: string
  emoji: string
  children: React.ReactNode
  onCancel: () => void
}) {
  return (
    <PatientShell>
      <button onClick={onCancel} className="text-sm font-bold text-g-ink-3 active:scale-95">
        ← All check-ins
      </button>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <h1 className="font-cute text-2xl font-bold text-g-ink">{title}</h1>
      </div>
      {children}
    </PatientShell>
  )
}

function ScreenerRunner({ screener, onDone, onCancel }: { screener: Screener; onDone: () => void; onCancel: () => void }) {
  const prev = getResult(screener.id)
  const [answers, setAnswers] = useState<number[]>(() =>
    screener.items.map((_, i) => (prev?.detail ? prev.detail[`q${i}`] ?? -1 : -1))
  )
  const allAnswered = answers.every((a) => a >= 0)
  const score = answers.reduce((sum, a) => sum + Math.max(0, a), 0)
  const sensitiveFlagged =
    screener.sensitiveIndex !== undefined && (answers[screener.sensitiveIndex] ?? 0) > 0

  function setAnswer(i: number, v: number) {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)))
  }

  function save() {
    const detail: Record<string, number> = {}
    answers.forEach((a, i) => (detail[`q${i}`] = a))
    saveResult({ id: screener.id, score, band: bandFor(screener, score), detail })
    onDone()
  }

  return (
    <RunnerShell title={screener.name} emoji={screener.emoji} onCancel={onCancel}>
      <p className="mt-2 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">{screener.prompt}</p>
      <div className="mt-3 space-y-3">
        {screener.items.map((item, i) => (
          <div key={i} className="rounded-3xl border border-g-border bg-white p-3.5 shadow-girly">
            <p className="text-sm font-bold text-g-ink">
              {i + 1}. {item}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {screener.options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setAnswer(i, o.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95",
                    answers[i] === o.value
                      ? "border-transparent bg-candy text-white"
                      : "border-g-border bg-g-canvas text-g-ink-2"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {sensitiveFlagged && (
        <div className="mt-3 rounded-3xl border border-g-pink bg-g-pink-soft p-4">
          <p className="font-cute text-sm font-bold text-g-ink">You deserve support right now 💗</p>
          <p className="mt-1 text-xs font-semibold text-g-ink-2">
            If you're having thoughts of harming yourself, please reach out. In the US you can call or text{" "}
            <a href="tel:988" className="underline">988</a> (Suicide & Crisis Lifeline), any time, free and confidential.
            You are not alone, and talking to your doctor about how you're feeling matters.
          </p>
        </div>
      )}

      {allAnswered && (
        <div className="mt-3 rounded-3xl border border-g-border bg-white p-4 text-center shadow-girly">
          <p className="text-xs font-bold text-g-ink-3">Your score</p>
          <p className="font-cute text-2xl font-bold text-g-ink">
            {score} <span className="text-base font-bold text-g-pink-deep">· {bandFor(screener, score)}</span>
          </p>
          <p className="mt-1 text-xs font-medium text-g-ink-2">A screen, not a diagnosis. Worth discussing with your doctor.</p>
        </div>
      )}

      <button
        onClick={save}
        disabled={!allAnswered}
        className="mt-3 w-full rounded-full bg-candy py-3 font-cute text-base font-bold text-white shadow-girly-pop active:scale-[0.98] disabled:opacity-50"
      >
        Save to my summary
      </button>
    </RunnerShell>
  )
}

function FGRunner({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const prev = getResult("fg")
  const [byArea, setByArea] = useState<Record<string, number>>(() => prev?.detail ?? {})
  const [ethnicity, setEthnicity] = useState<string>(() => prev?.meta?.ethnicity ?? "general")
  const total = fgTotal(byArea)
  const cutoff = fgCutoff(ethnicity)

  function save() {
    saveResult({ id: "fg", score: total, band: total >= cutoff ? "Above typical range" : "Typical range", detail: byArea, meta: { ethnicity } })
    onDone()
  }

  return (
    <RunnerShell title="Hair growth self-score" emoji="🧴" onCancel={onCancel}>
      <p className="mt-2 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">
        For each area, pick how much coarse/dark hair you notice. There's no &ldquo;right&rdquo; amount, this just helps
        you and your doctor track changes.
      </p>

      <div className="mt-3">
        <p className="px-1 text-xs font-bold text-g-ink-3">
          Reference range varies by background (cultural sensitivity matters):
        </p>
        <div className="no-scrollbar -mx-1 mt-1.5 flex gap-2 overflow-x-auto px-1 pb-1">
          {FG_ETHNICITY.map((e) => (
            <button
              key={e.id}
              onClick={() => setEthnicity(e.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95",
                ethnicity === e.id ? "border-transparent bg-candy text-white" : "border-g-border bg-g-canvas text-g-ink-2"
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {FG_AREAS.map((area) => (
          <div key={area.id} className="rounded-3xl border border-g-border bg-white p-3 shadow-girly">
            <p className="px-1 text-sm font-bold text-g-ink">{area.label}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {FG_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => setByArea((prev) => ({ ...prev, [area.id]: lvl.value }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95",
                    (byArea[area.id] ?? 0) === lvl.value
                      ? "border-transparent bg-candy text-white"
                      : "border-g-border bg-g-canvas text-g-ink-2"
                  )}
                >
                  {lvl.value} · {lvl.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-3xl border border-g-border bg-white p-4 text-center shadow-girly">
        <p className="text-xs font-bold text-g-ink-3">Total (mFG)</p>
        <p className="font-cute text-2xl font-bold text-g-ink">
          {total} <span className="text-sm font-bold text-g-pink-deep">/ 36</span>
        </p>
        <p className="mt-1 text-xs font-medium text-g-ink-2">
          {total >= cutoff
            ? `Above the typical reference range for your background (≥${cutoff}). Worth mentioning to your doctor.`
            : `Within the typical reference range for your background (under ${cutoff}).`}{" "}
          Not a diagnosis.
        </p>
      </div>

      <button
        onClick={save}
        className="mt-3 w-full rounded-full bg-candy py-3 font-cute text-base font-bold text-white shadow-girly-pop active:scale-[0.98]"
      >
        Save to my summary
      </button>
    </RunnerShell>
  )
}

function SeverityRunner({
  id,
  title,
  emoji,
  onDone,
  onCancel,
}: {
  id: AssessmentId
  title: string
  emoji: string
  onDone: () => void
  onCancel: () => void
}) {
  const prev = getResult(id)
  const [value, setValue] = useState<number>(prev?.score ?? -1)

  function save() {
    if (value < 0) return
    saveResult({ id, score: value, band: SEVERITY_4.find((s) => s.value === value)?.label })
    onDone()
  }

  return (
    <RunnerShell title={title} emoji={emoji} onCancel={onCancel}>
      <p className="mt-2 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">How would you describe it lately?</p>
      <div className="mt-3 space-y-2">
        {SEVERITY_4.map((s) => (
          <button
            key={s.value}
            onClick={() => setValue(s.value)}
            className={cn(
              "w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition active:scale-[0.99]",
              value === s.value ? "border-transparent bg-candy text-white" : "border-g-border bg-white text-g-ink"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button
        onClick={save}
        disabled={value < 0}
        className="mt-3 w-full rounded-full bg-candy py-3 font-cute text-base font-bold text-white shadow-girly-pop active:scale-[0.98] disabled:opacity-50"
      >
        Save to my summary
      </button>
    </RunnerShell>
  )
}
