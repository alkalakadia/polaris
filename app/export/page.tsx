"use client"

import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import { buildCyclePatterns, buildInsights, type CyclePattern, type InsightSummary } from "@/lib/insights"
import { getAllEntriesAsync } from "@/lib/tracker-store"
import {
  CHIP_GROUPS,
  FLOW_OPTIONS,
  type TrackEntry,
} from "@/lib/tracker"
import { GOALS, getProfile, hydrateProfileFromMetadata, type CycleProfile } from "@/lib/profile"
import { buildClinicalSummary } from "@/lib/clinical"

// Cute color themes for the album cover/accents.
const THEMES = [
  { id: "pink", label: "Bubblegum", from: "#FF8FB8", to: "#FF6FA5", soft: "#FFD9E7" },
  { id: "lavender", label: "Lavender", from: "#C9B6F2", to: "#B79CED", soft: "#E7DBFB" },
  { id: "peach", label: "Peach", from: "#FFC4A3", to: "#FFB38A", soft: "#FFE2CF" },
  { id: "mint", label: "Mint", from: "#A8E6CF", to: "#8FE0C2", soft: "#D6F6EA" },
] as const

type ThemeId = (typeof THEMES)[number]["id"]

interface ExportConfig {
  name: string
  theme: ThemeId
  sections: Record<string, boolean>
  chiefConcern: string
  tried: string
  questions: string[]
  notes: string
}

const SECTION_DEFS = [
  { key: "clinical", label: "Clinical summary (for your doctor)", emoji: "🩺" },
  { key: "summary", label: "Tracking summary", emoji: "📅" },
  { key: "symptoms", label: "Top symptoms & moods", emoji: "🩷" },
  { key: "cycle", label: "Period & pain", emoji: "🌷" },
  { key: "watchouts", label: "Things to discuss", emoji: "💛" },
  { key: "questions", label: "My questions for the doctor", emoji: "❓" },
  { key: "notes", label: "Personal notes", emoji: "📝" },
]

const CONFIG_KEY = "polaris.export.v1"

function loadConfig(): ExportConfig {
  const base: ExportConfig = {
    name: "",
    theme: "pink",
    sections: Object.fromEntries(SECTION_DEFS.map((s) => [s.key, true])),
    chiefConcern: "",
    tried: "",
    questions: ["Could my symptoms be PCOS-related?", "Should I get bloodwork done?"],
    notes: "",
  }
  if (typeof window === "undefined") return base
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY)
    return raw ? { ...base, ...JSON.parse(raw) } : base
  } catch {
    return base
  }
}

export default function ExportPage() {
  const [cfg, setCfg] = useState<ExportConfig>(loadConfig)
  const [entries, setEntries] = useState<TrackEntry[]>([])
  const [summary, setSummary] = useState<InsightSummary | null>(null)
  const [profile, setProfile] = useState<CycleProfile>({})
  const [patterns, setPatterns] = useState<CyclePattern[]>([])
  const [newQ, setNewQ] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    let active = true
    if (user?.user_metadata?.cycle) hydrateProfileFromMetadata(user.user_metadata.cycle)
    const prof = getProfile()
    if (active) setProfile(prof)
    getAllEntriesAsync().then((all) => {
      if (!active) return
      setEntries(all)
      setSummary(buildInsights(all))
      setPatterns(buildCyclePatterns(all, prof))
    })
    return () => {
      active = false
    }
  }, [user])

  // Meds/supplements the user has actually logged — handy for "what I've tried".
  const loggedMeds = (() => {
    const medGroup = CHIP_GROUPS.find((g) => g.key === "meds")
    if (!medGroup) return [] as string[]
    const ids = new Set<string>()
    for (const e of entries) for (const id of (e.meds as string[] | undefined) ?? []) ids.add(id)
    return [...ids].map((id) => medGroup.options.find((o) => o.id === id)?.label).filter(Boolean) as string[]
  })()

  const goalLabel = GOALS.find((g) => g.id === profile.goal)?.label
  const clinical = buildClinicalSummary(profile, entries)
  const hasClinical =
    clinical.menstrual.length > 0 ||
    clinical.body.length > 0 ||
    clinical.history.length > 0 ||
    clinical.meds.length > 0 ||
    clinical.labs.length > 0 ||
    clinical.symptomsByCategory.length > 0 ||
    clinical.screening.length > 0

  const snapshot = [
    profile.cycleLength
      ? `Cycle ~${profile.cycleLength} days${profile.cycleIrregular ? " (reports irregular)" : ""}`
      : null,
    profile.lastPeriodStart
      ? `last period ${new Date(profile.lastPeriodStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : null,
    goalLabel ? `goal: ${goalLabel}` : null,
    summary ? `${summary.daysTracked} days tracked` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  // Persist customization as it changes.
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
  }, [cfg])

  const theme = THEMES.find((t) => t.id === cfg.theme)!
  const update = (partial: Partial<ExportConfig>) => setCfg((c) => ({ ...c, ...partial }))
  const toggleSection = (key: string) =>
    setCfg((c) => ({ ...c, sections: { ...c.sections, [key]: !c.sections[key] } }))

  function addQuestion() {
    const q = newQ.trim()
    if (!q) return
    update({ questions: [...cfg.questions, q] })
    setNewQ("")
  }
  function removeQuestion(i: number) {
    update({ questions: cfg.questions.filter((_, idx) => idx !== i) })
  }

  const dateRange = entries.length
    ? `${entries[entries.length - 1].date} → ${entries[0].date}`
    : "No entries yet"

  const notesEntries = entries.filter((e) => e.notes && e.notes.trim()).slice(0, 5)

  return (
    <PatientShell>
      {/* --- Builder controls (won't print) --- */}
      <div className="print-hide">
        <div className="flex items-center gap-2">
          <span className="animate-float text-3xl">📄</span>
          <div>
            <h1 className="font-cute text-3xl font-bold text-g-ink">Gyno visit PDF</h1>
            <p className="text-sm font-semibold text-g-ink-3">Make it cute, make it yours 💕</p>
          </div>
        </div>

        {/* Name */}
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <label className="font-cute text-sm font-bold text-g-ink">Your name (optional)</label>
          <input
            value={cfg.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Sarah"
            className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-semibold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
          />
        </section>

        {/* Pre-visit summary inputs — these land at the TOP of the PDF for your doctor */}
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <p className="font-cute text-sm font-bold text-g-ink">For your doctor 🩺</p>
          <p className="mb-3 text-xs font-semibold text-g-ink-3">
            This goes right at the top so your gyno sees the important stuff first.
          </p>
          <label className="text-sm font-bold text-g-ink">Why are you going in? (main concern)</label>
          <textarea
            value={cfg.chiefConcern}
            onChange={(e) => update({ chiefConcern: e.target.value })}
            rows={2}
            placeholder="e.g. irregular periods and new chin hair for ~6 months"
            className="mt-1.5 w-full resize-none rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
          />
          <label className="mt-3 block text-sm font-bold text-g-ink">What have you already tried?</label>
          <textarea
            value={cfg.tried}
            onChange={(e) => update({ tried: e.target.value })}
            rows={2}
            placeholder="e.g. cut back on sugar, started walking, tried inositol"
            className="mt-1.5 w-full resize-none rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
          />
          {loggedMeds.length > 0 && (
            <p className="mt-2 text-xs font-semibold text-g-ink-3">
              We'll also include what you logged: {loggedMeds.join(", ")}
            </p>
          )}
        </section>

        {/* Theme */}
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <p className="mb-3 font-cute text-sm font-bold text-g-ink">Cover color 🎨</p>
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ theme: t.id })}
                className={cn(
                  "flex-1 rounded-2xl p-1 transition active:scale-95",
                  cfg.theme === t.id ? "ring-2 ring-g-ink ring-offset-2" : ""
                )}
              >
                <span
                  className="block h-10 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                />
                <span className="mt-1 block text-[0.65rem] font-bold text-g-ink-2">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Sections */}
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <p className="mb-3 font-cute text-sm font-bold text-g-ink">What to include</p>
          <div className="space-y-2">
            {SECTION_DEFS.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSection(s.key)}
                className="flex w-full items-center justify-between rounded-2xl bg-g-canvas px-4 py-3 text-left active:scale-[0.99]"
              >
                <span className="text-sm font-bold text-g-ink">
                  {s.emoji} {s.label}
                </span>
                <span
                  className={cn(
                    "relative h-6 w-11 rounded-full transition",
                    cfg.sections[s.key] ? "bg-candy" : "bg-g-border-2"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                      cfg.sections[s.key] ? "left-[1.4rem]" : "left-0.5"
                    )}
                  />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Custom questions */}
        {cfg.sections.questions && (
          <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
            <p className="mb-3 font-cute text-sm font-bold text-g-ink">My questions for the doctor ❓</p>
            <div className="space-y-2">
              {cfg.questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2 rounded-2xl bg-g-canvas px-3 py-2.5">
                  <span className="flex-1 text-sm font-semibold text-g-ink">💬 {q}</span>
                  <button onClick={() => removeQuestion(i)} className="text-g-ink-3 active:scale-90" aria-label="Remove">
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                placeholder="Add a question…"
                className="flex-1 rounded-2xl border border-g-border bg-g-canvas px-4 py-2.5 text-sm font-semibold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
              />
              <button onClick={addQuestion} className="rounded-2xl bg-candy px-4 text-sm font-bold text-white active:scale-95">
                Add
              </button>
            </div>
          </section>
        )}

        {/* Custom notes */}
        {cfg.sections.notes && (
          <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
            <p className="mb-2 font-cute text-sm font-bold text-g-ink">Anything else to add 📝</p>
            <textarea
              value={cfg.notes}
              onChange={(e) => update({ notes: e.target.value })}
              rows={3}
              placeholder="Extra context for your doctor, how you've been feeling, etc."
              className="w-full resize-none rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
            />
          </section>
        )}

        {/* Download */}
        <button
          onClick={() => window.print()}
          className="mt-5 w-full rounded-full bg-candy py-4 font-cute text-lg font-bold text-white shadow-girly-pop active:scale-[0.98]"
        >
          Download my PDF 💖
        </button>
        <p className="mt-2 text-center text-xs font-semibold text-g-ink-3">
          Tip: choose “Save as PDF” in the print dialog. Preview below 👇
        </p>
      </div>

      {/* --- Printable album preview --- */}
      <div className="print-area mt-6 overflow-hidden rounded-3xl border border-g-border bg-white shadow-girly">
        {/* Cover */}
        <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
          <p className="text-sm font-bold opacity-90">🌸 Polaris · My health summary</p>
          <h2 className="font-cute text-3xl font-extrabold leading-tight">
            {cfg.name ? `${cfg.name}'s` : "My"} gyno visit notes
          </h2>
          <p className="mt-1 text-sm font-semibold opacity-90">Tracked {dateRange}</p>
        </div>

        <div className="space-y-5 p-6">
          {/* Pre-visit summary — surfaced FIRST so the clinician sees what matters */}
          <section className="rounded-2xl border-2 p-4" style={{ borderColor: theme.to }}>
            <p className="text-[0.65rem] font-extrabold uppercase tracking-wider" style={{ color: theme.to }}>
              For your provider
            </p>
            <h3 className="font-cute text-lg font-bold text-g-ink">Pre-visit summary</h3>

            {cfg.chiefConcern.trim() && (
              <PreItem label="Why I'm here">{cfg.chiefConcern}</PreItem>
            )}
            {snapshot && <PreItem label="Snapshot">{snapshot}</PreItem>}
            {(cfg.tried.trim() || loggedMeds.length > 0) && (
              <PreItem label="What I've tried">
                {[cfg.tried.trim(), loggedMeds.join(", ")].filter(Boolean).join(" · ")}
              </PreItem>
            )}
            {patterns.length > 0 && (
              <PreItem label="Patterns I've noticed">
                <ul className="space-y-0.5">
                  {patterns.map((p) => (
                    <li key={p.label}>• {p.label} {p.phaseHint}</li>
                  ))}
                </ul>
              </PreItem>
            )}
            {cfg.sections.questions && cfg.questions.length > 0 && (
              <PreItem label="My questions">
                <ul className="space-y-0.5">
                  {cfg.questions.map((q, i) => (
                    <li key={i} className="font-semibold text-g-ink">💬 {q}</li>
                  ))}
                </ul>
              </PreItem>
            )}
          </section>

          {cfg.sections.clinical && hasClinical && (
            <AlbumSection title="Clinical summary" emoji="🩺" soft={theme.soft}>
              {clinical.menstrual.length > 0 && <ClinList label="Menstrual history" items={clinical.menstrual} />}
              {clinical.body.length > 0 && <ClinList label="Body & vitals" items={clinical.body} />}
              {clinical.history.length > 0 && <ClinList label="Relevant history" items={clinical.history} />}
              {clinical.meds.length > 0 && (
                <ClinList label="Meds & supplements (days logged)" items={clinical.meds.map((m) => `${m.label}: ${m.days} day${m.days === 1 ? "" : "s"}`)} />
              )}
              {clinical.measurements.length > 0 && <ClinList label="Measurements" items={clinical.measurements} />}
              {clinical.labs.length > 0 && (
                <ClinList label="Lab results (self-reported)" items={clinical.labs.filter((l) => l.name).map((l) => `${l.name}: ${l.value}`)} />
              )}
              {clinical.symptomsByCategory.length > 0 && (
                <div className="mb-2">
                  <p className="text-[0.7rem] font-bold uppercase tracking-wide text-g-ink-3">Symptoms reported</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {clinical.symptomsByCategory.map((c) => (
                      <li key={c.title} className="text-sm font-medium text-g-ink-2">
                        <span className="font-bold text-g-ink">{c.title}:</span> {c.items.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {clinical.screening.length > 0 && (
                <div className="mb-2 rounded-xl p-2.5" style={{ background: theme.soft }}>
                  <p className="text-[0.7rem] font-bold uppercase tracking-wide text-g-ink-3">Worth discussing / screening</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {clinical.screening.map((s) => (
                      <li key={s.label} className="text-xs font-medium text-g-ink-2">
                        <span className="font-bold text-g-ink">{s.label}:</span> {s.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2 rounded-xl bg-white/70 p-2.5">
                <p className="text-[0.7rem] font-bold uppercase tracking-wide text-g-ink-3">Signals (data, not a diagnosis)</p>
                <ul className="mt-1 space-y-0.5">
                  {clinical.rotterdam.map((r) => (
                    <li key={r.label} className="text-xs font-medium text-g-ink-2">
                      <span className="font-bold text-g-ink">{r.label}:</span> {r.detail}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[0.65rem] font-semibold text-g-ink-3">
                  These are patient-logged data points, not a diagnosis. PCOS diagnosis requires clinical evaluation.
                </p>
              </div>
            </AlbumSection>
          )}

          {cfg.sections.summary && summary && (
            <AlbumSection title="Tracking summary" emoji="📅" soft={theme.soft}>
              <div className="grid grid-cols-2 gap-3">
                <Mini label="Days tracked" value={`${summary.daysTracked}`} />
                <Mini label="Period days" value={`${summary.flowDays}`} />
                <Mini label="Avg pain" value={summary.avgPain != null ? `${summary.avgPain.toFixed(1)}/10` : "—"} />
                <Mini label="Avg sleep" value={summary.avgSleep != null ? `${summary.avgSleep.toFixed(1)}h` : "—"} />
              </div>
            </AlbumSection>
          )}

          {cfg.sections.symptoms && summary && (summary.topSymptoms.length > 0 || summary.topMoods.length > 0) && (
            <AlbumSection title="Most common" emoji="🩷" soft={theme.soft}>
              <div className="flex flex-wrap gap-2">
                {[...summary.topSymptoms, ...summary.topMoods].map((s) => (
                  <span key={`${s.group}-${s.option.id}`} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-g-ink shadow-sm">
                    {s.option.emoji} {s.option.label} · {s.count}×
                  </span>
                ))}
              </div>
            </AlbumSection>
          )}

          {cfg.sections.cycle && summary && (
            <AlbumSection title="Period & pain" emoji="🌷" soft={theme.soft}>
              <p className="text-sm font-semibold text-g-ink-2">
                {summary.flowDays} day{summary.flowDays === 1 ? "" : "s"} of period logged over {summary.daysTracked} tracked
                day{summary.daysTracked === 1 ? "" : "s"}.
                {summary.avgPain != null && ` Average pain reported around ${summary.avgPain.toFixed(1)} out of 10.`}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FLOW_OPTIONS.filter((f) => entries.some((e) => e.flow === f.id && f.id !== "none")).map((f) => (
                  <span key={f.id} className="rounded-full px-2.5 py-1 text-xs font-bold text-g-ink" style={{ background: theme.soft }}>
                    {f.emoji} {f.label}
                  </span>
                ))}
              </div>
            </AlbumSection>
          )}

          {cfg.sections.watchouts && summary && summary.watchOuts.length > 0 && (
            <AlbumSection title="Things I'd like to discuss" emoji="💛" soft={theme.soft}>
              <ul className="space-y-2">
                {summary.watchOuts.map((w, i) => (
                  <li key={i} className="text-sm font-semibold text-g-ink">
                    {w.emoji} {w.title}
                    <span className="block text-xs font-medium text-g-ink-2">{w.body}</span>
                  </li>
                ))}
              </ul>
            </AlbumSection>
          )}

          {cfg.sections.notes && (cfg.notes.trim() || notesEntries.length > 0) && (
            <AlbumSection title="Notes" emoji="📝" soft={theme.soft}>
              {cfg.notes.trim() && <p className="text-sm font-medium text-g-ink">{cfg.notes}</p>}
              {notesEntries.map((e) => (
                <p key={e.date} className="mt-1 text-xs font-medium text-g-ink-2">
                  <span className="font-bold">{e.date}:</span> {e.notes}
                </p>
              ))}
            </AlbumSection>
          )}

          <p className="border-t border-g-border pt-3 text-center text-[0.65rem] font-semibold text-g-ink-3">
            Made with Polaris 🌸 · This is a personal tracking summary, not a
            diagnosis or medical record. Please discuss with your doctor.
          </p>
        </div>
      </div>
    </PatientShell>
  )
}

function ClinList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-2">
      <p className="text-[0.7rem] font-bold uppercase tracking-wide text-g-ink-3">{label}</p>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm font-medium text-g-ink-2">{it}</li>
        ))}
      </ul>
    </div>
  )
}

function PreItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-wide text-g-ink-3">{label}</p>
      <div className="text-sm font-medium text-g-ink-2">{children}</div>
    </div>
  )
}

function AlbumSection({ title, emoji, soft, children }: { title: string; emoji: string; soft: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-4" style={{ background: soft }}>
      <h3 className="mb-2 font-cute text-base font-bold text-g-ink">
        {emoji} {title}
      </h3>
      {children}
    </section>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
      <p className="font-cute text-xl font-bold text-g-ink">{value}</p>
      <p className="text-[0.65rem] font-bold text-g-ink-3">{label}</p>
    </div>
  )
}
