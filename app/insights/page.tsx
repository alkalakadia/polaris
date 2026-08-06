"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { PatientShell } from "@/components/patient-shell"
import { CycleCalendar } from "@/components/cycle-calendar"
import { SupportResource } from "@/components/support-resource"
import { CycleLengthChart, TrendSparkline } from "@/components/charts"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import { buildCyclePatterns, buildInsights, monthlySeries, type CyclePattern, type InsightSummary } from "@/lib/insights"
import { buildScreening, type ScreeningPrompt } from "@/lib/clinical"
import { getAllEntriesAsync, saveEntryAsync } from "@/lib/tracker-store"
import { MedicalIcon, type MedicalIconName } from "@/components/medical-icon"
import { canPredictCycle, cycleHistory, cycleLengthSeries, deriveLastPeriodStart, type CycleHistory } from "@/lib/cycle"
import { getProfile, hydrateProfileFromMetadata, type CycleProfile, type Goal } from "@/lib/profile"
import { profileGoals } from "@/lib/tracking-prefs"
import { type TrackEntry } from "@/lib/tracker"
import { SCREENERS, getResult } from "@/lib/assessments"
import { getLabs } from "@/lib/labs"
import { getShaveDays, shaveStats } from "@/lib/hirsutism"
import { CONTRA_TYPES, concernLabel, getHistory } from "@/lib/history"

interface Glance {
  label: string
  value: string
  sub: string
}

function iconForContent(value?: string): MedicalIconName {
  const s = (value ?? "").toLowerCase()

  if (s.includes("sleep") || s.includes("😴")) return "sleep"
  if (s.includes("pain") || s.includes("symptom")) return "heart"
  if (s.includes("mood") || s.includes("sad") || s.includes("happy")) return "brain"
  if (s.includes("cycle") || s.includes("period") || s.includes("flow")) return "cycle"
  if (s.includes("doctor") || s.includes("visit")) return "doctor"
  if (s.includes("lab")) return "labs"
  if (s.includes("diet")) return "leaf"
  return "health"
}

function buildGlance(goals: Goal[], history: CycleHistory | null, summary: InsightSummary | null): Glance[] {
  const sv = shaveStats()
  const pool: (Glance & { id: string; goals: Goal[]; hasData: boolean })[] = [
    {
      id: "cycle",
      label: "Avg cycle",
      value: history?.average ? `${history.average} days` : "—",
      sub: history && history.regularity !== "unknown" ? history.regularity : "learning your cycle",
      goals: ["regulate", "understand", "ttc"],
      hasData: history?.average != null,
    },
    {
      id: "period",
      label: "Avg period",
      value: history?.averagePeriod ? `${history.averagePeriod} days` : "—",
      sub: "per cycle",
      goals: ["regulate"],
      hasData: history?.averagePeriod != null,
    },
    {
      id: "flow",
      label: "Period days",
      value: `${summary?.flowDays ?? 0}`,
      sub: "logged",
      goals: ["ttc", "regulate"],
      hasData: (summary?.flowDays ?? 0) > 0,
    },
    {
      id: "pain",
      label: "Avg pain",
      value: summary?.avgPain != null ? `${summary.avgPain.toFixed(1)}/10` : "—",
      sub: "when logged",
      goals: ["symptoms"],
      hasData: summary?.avgPain != null,
    },
    {
      id: "sleep",
      label: "Avg sleep",
      value: summary?.avgSleep != null ? `${summary.avgSleep.toFixed(1)}h` : "—",
      sub: "per night",
      goals: ["symptoms", "weight"],
      hasData: summary?.avgSleep != null,
    },
    {
      id: "shave",
      label: "Shave cadence",
      value: sv.averageInterval != null ? `~${sv.averageInterval}d` : "—",
      sub: "between shaves",
      goals: ["symptoms"],
      hasData: sv.averageInterval != null,
    },
    {
      id: "days",
      label: "Days tracked",
      value: `${summary?.daysTracked ?? 0}`,
      sub: "logged so far",
      goals: [],
      hasData: (summary?.daysTracked ?? 0) > 0,
    },
  ]

  const score = (g: Goal[]) => g.filter((x) => goals.includes(x)).length
  const ranked = pool
    .map((s, i) => ({ s, i }))
    .sort((a, b) => score(b.s.goals) - score(a.s.goals) || Number(b.s.hasData) - Number(a.s.hasData) || a.i - b.i)
    .map((x) => x.s)

  return ranked.slice(0, 4).map(({ label, value, sub }) => ({ label, value, sub }))
}

function ClinicalInsights({ profile, entries }: { profile: CycleProfile; entries: TrackEntry[] }) {
  const [cards, setCards] = useState<Array<{ icon: MedicalIconName; title: string; body: string; href: string }>>([])

  useEffect(() => {
    const out: Array<{ icon: MedicalIconName; title: string; body: string; href: string }> = []
    const sp = (profile.symptomProfile ?? {}) as Record<string, string[]>
    const cycleSP = sp["cycle"] ?? []
    const cycleSignal =
      !!profile.cycleIrregular ||
      (profile.cycleLength != null && profile.cycleLength >= 35) ||
      ["irregular", "infrequent", "missing", "long", "unpredictable"].some((id) => cycleSP.includes(id))

    if (cycleSignal) {
      out.push({
        icon: "cycle",
        title: "Irregular cycles are worth raising",
        body: "Cycle irregularity is one of the three areas clinicians check for PMOS (the Rotterdam criteria). Bring it up at your visit.",
        href: "/period",
      })
    }

    const fg = getResult("fg")
    const acne = getResult("acne")
    const hairloss = getResult("hairloss")
    const skinDays = entries.filter((e) => ((e.skinHair as string[]) ?? []).some((x) => ["acne", "newhair", "darkpatches"].includes(x))).length
    const androgen = fg?.band === "Above typical range" || (acne?.score ?? 0) >= 2 || (hairloss?.score ?? 0) >= 2 || skinDays > 0

    if (androgen) {
      out.push({
        icon: "heart",
        title: "Hair & skin signs matter",
        body: "Extra hair, acne, or hair loss are androgen-related signs clinicians look at. Tracking your hair-removal cadence and photos shows whether treatment is helping.",
        href: "/hirsutism",
      })
    }

    const h = getHistory()
    const onHormonal = h.contraception.some((c) => c.current && CONTRA_TYPES.find((t) => t.id === c.type)?.hormonal)

    if (onHormonal) {
      out.push({
        icon: "doctor",
        title: "You're on hormonal birth control",
        body: "It can ease or mask PMOS symptoms, so your doctor will read your cycle in that context. Keeping your BC history noted helps a lot.",
        href: "/history",
      })
    }

    if (getLabs().some((l) => l.labId === "amh")) {
      out.push({
        icon: "labs",
        title: "You've logged AMH",
        body: "AMH is an emerging PMOS marker, now an accepted alternative in the 2023 guidelines. Good to have on record for your visit.",
        href: "/labs",
      })
    }

    if (out.length) {
      out.push({
        icon: "leaf",
        title: "No single 'PMOS diet' is best",
        body: "The evidence says balanced, sustainable eating beats any fad. See the basics whenever diet feels confusing.",
        href: "/guide",
      })
    }

    setCards(out)
  }, [profile, entries])

  if (cards.length === 0) return null

  return (
    <section className="mt-4">
      <h2 className="px-1 font-cute text-base font-bold text-g-ink">Worth discussing with your doctor</h2>
      <p className="mt-0.5 px-1 text-xs font-semibold text-g-ink-3">Gentle and evidence-based, never a diagnosis.</p>
      <div className="mt-2 space-y-2">
        {cards.map((c, i) => (
          <Link key={i} href={c.href} className="flex items-start gap-3 rounded-3xl border border-g-border bg-white p-3.5 shadow-girly active:scale-[0.99]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-candy-soft text-g-ink">
              <MedicalIcon name={c.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-g-ink">{c.title}</span>
              <span className="block text-xs font-medium text-g-ink-2">{c.body}</span>
            </span>
            <span className="shrink-0 text-g-ink-3">›</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function HealthSnapshot() {
  const [chips, setChips] = useState<Array<{ label: string; value: string }>>([])

  useEffect(() => {
    const out: Array<{ label: string; value: string }> = []
    const h = getHistory()
    const mc = h.mainConcern ? concernLabel(h.mainConcern.id) : null
    if (mc) out.push({ label: "Main concern", value: mc })
    const fg = getResult("fg")
    if (fg) out.push({ label: "Hair score (mFG)", value: `${fg.score}${fg.band ? ` · ${fg.band}` : ""}` })
    const acne = getResult("acne")
    if (acne?.band) out.push({ label: "Acne", value: acne.band })
    for (const s of SCREENERS) {
      const r = getResult(s.id)
      if (r) out.push({ label: s.name.replace(/\s*\(.*\)/, ""), value: r.band ?? String(r.score) })
    }
    const labs = getLabs()
    if (labs.length) out.push({ label: "Labs logged", value: String(labs.length) })
    const sv = shaveStats()
    if (sv.averageInterval != null) out.push({ label: "Shave cadence", value: `~${sv.averageInterval}d` })
    if (h.contraception.length) out.push({ label: "Birth control", value: `${h.contraception.length} logged` })
    setChips(out)
  }, [])

  if (chips.length === 0) return null

  return (
    <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <div className="flex items-center justify-between">
        <h2 className="font-cute text-base font-bold text-g-ink">Your health snapshot</h2>
        <Link href="/export" className="text-xs font-bold text-g-pink-deep active:scale-95">
          Add to visit summary ›
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((c, i) => (
          <span key={i} className="rounded-2xl bg-candy-soft px-2.5 py-1.5 text-xs font-bold text-g-ink">
            {c.label}: <span className="text-g-pink-deep">{c.value}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

export default function InsightsPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<InsightSummary | null>(null)
  const [entries, setEntries] = useState<TrackEntry[]>([])
  const [profile, setProfile] = useState<CycleProfile>({})
  const [patterns, setPatterns] = useState<CyclePattern[]>([])
  const [screening, setScreening] = useState<ScreeningPrompt[]>([])
  const [sensitive, setSensitive] = useState(false)
  const [history, setHistory] = useState<CycleHistory | null>(null)

  async function reload(prof: CycleProfile) {
    const all = await getAllEntriesAsync()
    setEntries(all)
    setSummary(buildInsights(all))
    setPatterns(buildCyclePatterns(all, prof))
    const sc = buildScreening(prof, all)
    setScreening(sc.prompts)
    setSensitive(sc.sensitive)
    setHistory(cycleHistory(all))
  }

  useEffect(() => {
    if (user?.user_metadata?.cycle) hydrateProfileFromMetadata(user.user_metadata.cycle)
    const prof = getProfile()
    setProfile(prof)
    reload(prof)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function togglePeriod(date: string, makePeriod: boolean) {
    const existing = entries.find((e) => e.date === date) ?? { date }
    await saveEntryAsync({ ...existing, date, flow: makePeriod ? "medium" : "none" })
    await reload(profile)
  }

  const anchor = deriveLastPeriodStart(entries) ?? profile.lastPeriodStart ?? null
  const canPredict = history ? canPredictCycle(history, profile) : false
  const weightSeries = monthlySeries(entries, "weightKg")

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-g-canvas text-g-pink-deep">
          <MedicalIcon name="insights" size={24} className="text-g-pink-deep" />
        </span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Your insights</h1>
          <p className="text-sm font-semibold text-g-ink-3">Patterns from what you tracked</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-g-lavender/40 bg-g-lavender-soft px-4 py-3">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-g-ink">
          <MedicalIcon name="doctor" size={16} className="text-g-ink" />
          These are gentle observations, not medical advice. MyPMOS never diagnoses. For anything on your mind, please see a doctor.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {buildGlance(profileGoals(profile), history, summary).map((s) => (
          <div key={s.label} className="rounded-2xl border border-g-border bg-white px-4 py-4 shadow-girly">
            <p className="text-xs font-medium text-g-ink-3">{s.label}</p>
            <p className="mt-1 font-cute text-xl leading-none text-g-pink-deep">{s.value}</p>
            <p className="mt-1 text-[11px] font-medium capitalize text-g-ink-3">{s.sub}</p>
          </div>
        ))}
      </div>

      <HealthSnapshot />
      <ClinicalInsights profile={profile} entries={entries} />

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-g-ink-3">Tap a day to see what you logged.</p>
          <Link href="/period" className="text-xs font-bold text-g-pink-deep active:scale-95">
            Log period ›
          </Link>
        </div>
        <CycleCalendar entries={entries} profile={profile} anchor={anchor} onTogglePeriod={togglePeriod} shaveDays={new Set(getShaveDays())} showPredictions={canPredict} />
      </div>

      {history && history.count >= 1 && (
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <div className="mb-2 flex items-center gap-2">
            <MedicalIcon name="cycle" size={18} className="text-g-ink" />
            <h2 className="font-cute text-base font-bold text-g-ink">Your cycle history</h2>
          </div>
          {history.average ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-candy-soft px-3 py-1.5 text-sm font-bold text-g-ink">
                  Avg cycle {history.average} days
                </span>
                {history.averagePeriod && (
                  <span className="rounded-full bg-candy-soft px-3 py-1.5 text-sm font-bold text-g-ink">
                    Avg period {history.averagePeriod} days
                  </span>
                )}
                <span className="rounded-full bg-candy-soft px-3 py-1.5 text-sm font-bold text-g-ink">
                  {history.shortest}–{history.longest} day range
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-bold",
                    history.regularity === "irregular" ? "bg-g-butter-soft text-g-ink" : "bg-g-mint-soft text-g-ink"
                  )}
                >
                  {history.regularity === "irregular" ? "Cycles vary a lot" : "Fairly regular"}
                </span>
              </div>
              {history.lengths.length >= 3 ? (
                <div className="mt-3 rounded-2xl bg-g-canvas px-3 py-3">
                  <CycleLengthChart points={cycleLengthSeries(entries)} average={history.average} />
                </div>
              ) : history.lengths.length > 0 ? (
                <p className="mt-2 text-sm font-semibold text-g-ink-3">
                  Recent cycles: {history.lengths.slice(-6).join(", ")} days
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-semibold text-g-ink-3">
              Log a couple of periods (and backfill past ones on the calendar) and MyPMOS will learn your cycle length and how regular it is.
            </p>
          )}
          <p className="mt-2 text-[0.7rem] font-semibold text-g-ink-3">Keep tracking to strengthen these cycle predictions over time.</p>
        </section>
      )}

      {patterns.length > 0 && (
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <div className="mb-3 flex items-center gap-2">
            <MedicalIcon name="insights" size={18} className="text-g-ink" />
            <h2 className="font-cute text-base font-bold text-g-ink">Your cycle patterns</h2>
          </div>
          <div className="space-y-2.5">
            {patterns.map((p) => (
              <div key={p.label} className="rounded-2xl bg-candy-soft px-4 py-3">
                <p className="text-sm font-bold text-g-ink">
                  {p.emoji} You often log {p.label.toLowerCase()} {p.phaseHint}.
                </p>
                <p className="text-xs font-semibold text-g-ink-3">Seen {p.count} times in your logs</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {sensitive && (
        <div className="mt-4">
          <SupportResource />
        </div>
      )}

      {screening.length > 0 && (
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <div className="mb-3 flex items-center gap-2">
            <MedicalIcon name="doctor" size={18} className="text-g-ink" />
            <h2 className="font-cute text-base font-bold text-g-ink">Worth chatting with your doctor about</h2>
          </div>
          <div className="space-y-2.5">
            {screening.map((s) => (
              <div key={s.label} className="rounded-2xl bg-g-butter-soft px-4 py-3">
                <p className="font-cute text-sm font-bold text-g-ink">{s.label}</p>
                <p className="mt-0.5 text-sm font-medium text-g-ink-2">{s.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.7rem] font-semibold text-g-ink-3">
            These are gentle suggestions based on what you logged, not a diagnosis. Your doctor can help you interpret them.
          </p>
        </section>
      )}

      {!summary || !summary.enoughData ? (
        <div className="mt-4 rounded-3xl border border-g-border bg-white p-6 text-center shadow-girly">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-g-canvas text-g-ink-3">
            <MedicalIcon name="leaf" size={24} className="text-g-ink-3" />
          </div>
          <p className="mt-3 font-cute text-lg font-bold text-g-ink">Track a few days to unlock more insights</p>
          <p className="mt-1 text-sm font-semibold text-g-ink-3">
            The more you log, the more patterns MyPMOS can gently show you.
          </p>
          <Link href="/track" className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white shadow-girly-pop active:scale-95">
            <MedicalIcon name="checklist" size={16} className="text-white" />
            Start tracking
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat icon="heart" value={summary.avgPain != null ? summary.avgPain.toFixed(1) : "—"} label="avg pain /10" tint="bg-g-lavender-soft" />
            <Stat icon="sleep" value={summary.avgSleep != null ? `${summary.avgSleep.toFixed(1)}h` : "—"} label="avg sleep" tint="bg-g-sky-soft" />
          </div>

          {weightSeries.length >= 2 && (
            <Section title="Weight trend">
              <TrendSparkline points={weightSeries.map((p) => ({ label: p.label, value: p.value }))} unit=" kg" />
            </Section>
          )}

          {summary.topSymptoms.length > 0 && (
            <Section title="Top symptoms">
              {summary.topSymptoms.map((s) => (
                <BarRow key={s.option.id} icon={iconForContent(s.option.label)} label={s.option.label} count={s.count} total={summary.daysTracked} />
              ))}
            </Section>
          )}
          {summary.topMoods.length > 0 && (
            <Section title="Top moods">
              {summary.topMoods.map((s) => (
                <BarRow key={s.option.id} icon={iconForContent(s.option.label)} label={s.option.label} count={s.count} total={summary.daysTracked} />
              ))}
            </Section>
          )}

          {summary.watchOuts.length > 0 && (
            <Section title="Watch-outs">
              <div className="space-y-3">
                {summary.watchOuts.map((w, i) => (
                  <div key={i} className="rounded-2xl bg-g-butter-soft px-4 py-3">
                    <p className="font-cute text-sm font-bold text-g-ink">
                      {w.title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-g-ink-2">{w.body}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="mt-5 rounded-3xl bg-candy p-5 shadow-girly-pop">
            <p className="mt-1 text-sm font-semibold text-white/90">
              Turn everything you tracked into a cute, clear PDF to bring along.
            </p>
            <Link href="/export" className="mt-3 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-g-pink-deep active:scale-95">
              Make my Gyno PDF
            </Link>
          </div>
        </>
      )}
    </PatientShell>
  )
}

function Stat({
  icon,
  value,
  label,
  tint,
}: {
  icon: MedicalIconName
  value: string
  label: string
  tint: string
}) {
  return (
    <div className="rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl text-current ${tint}`}>
        <MedicalIcon name={icon} size={18} className="text-current" />
      </span>
      <p className="mt-2 font-cute text-2xl font-bold text-g-ink">{value}</p>
      <p className="text-xs font-bold text-g-ink-3">{label}</p>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <div className="mb-3 flex items-center gap-2">
        <MedicalIcon name="insights" size={18} className="text-g-ink" />
        <h2 className="font-cute text-base font-bold text-g-ink">{title}</h2>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function BarRow({
  icon,
  label,
  count,
  total,
}: {
  icon: MedicalIconName
  label: string
  count: number
  total: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold text-g-ink">
        <span className="flex items-center gap-2">
          <MedicalIcon name={icon} size={16} className="text-current" />
          {label}
        </span>
        <span className="text-g-ink-3">{count}×</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-g-canvas-2">
        <div className="h-full rounded-full bg-candy" style={{ width: `${Math.max(pct, 6)}%` }} />
      </div>
    </div>
  )
}