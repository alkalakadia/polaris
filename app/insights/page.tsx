"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { CycleCalendar } from "@/components/cycle-calendar"
import { useAuth } from "@/lib/auth"
import { buildCyclePatterns, buildInsights, type CyclePattern, type InsightSummary } from "@/lib/insights"
import { getAllEntriesAsync } from "@/lib/tracker-store"
import { deriveLastPeriodStart } from "@/lib/cycle"
import { getProfile, hydrateProfileFromMetadata, type CycleProfile } from "@/lib/profile"
import type { TrackEntry } from "@/lib/tracker"

export default function InsightsPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<InsightSummary | null>(null)
  const [entries, setEntries] = useState<TrackEntry[]>([])
  const [profile, setProfile] = useState<CycleProfile>({})
  const [patterns, setPatterns] = useState<CyclePattern[]>([])

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

  const anchor = deriveLastPeriodStart(entries) ?? profile.lastPeriodStart ?? null

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">✨</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">Your insights</h1>
          <p className="text-sm font-semibold text-g-ink-3">Patterns from what you tracked 💗</p>
        </div>
      </div>

      {/* Friendly, prominent disclaimer */}
      <div className="mt-4 rounded-3xl border border-g-lavender/40 bg-g-lavender-soft px-4 py-3">
        <p className="text-sm font-bold text-g-ink">
          🩺 These are gentle observations, not medical advice. Polaris never
          diagnoses. For anything on your mind, please see a doctor.
        </p>
      </div>

      {/* History calendar — always available */}
      <div className="mt-4">
        <CycleCalendar entries={entries} profile={profile} anchor={anchor} />
      </div>

      {/* Cycle-relative patterns */}
      {patterns.length > 0 && (
        <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
          <h2 className="mb-3 font-cute text-base font-bold text-g-ink">🔮 Your cycle patterns</h2>
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
          <p className="mt-3 text-[0.7rem] font-semibold text-g-ink-3">
            Estimated from your own logs. Patterns get sharper the more you track. Not medical advice. 💗
          </p>
        </section>
      )}

      {!summary || !summary.enoughData ? (
        <div className="mt-4 rounded-3xl border border-g-border bg-white p-6 text-center shadow-girly">
          <span className="text-4xl">🌱</span>
          <p className="mt-3 font-cute text-lg font-bold text-g-ink">Track a few days to unlock more insights</p>
          <p className="mt-1 text-sm font-semibold text-g-ink-3">
            The more you log, the more patterns Polaris can gently show you.
          </p>
          <Link
            href="/track"
            className="mt-4 inline-block rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white shadow-girly-pop active:scale-95"
          >
            Start tracking 📝
          </Link>
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat emoji="📅" value={`${summary.daysTracked}`} label="days tracked" tint="bg-g-pink-soft" />
            <Stat emoji="🌷" value={`${summary.flowDays}`} label="period days" tint="bg-g-peach-soft" />
            <Stat
              emoji="🩹"
              value={summary.avgPain != null ? summary.avgPain.toFixed(1) : "—"}
              label="avg pain /10"
              tint="bg-g-lavender-soft"
            />
            <Stat
              emoji="😴"
              value={summary.avgSleep != null ? `${summary.avgSleep.toFixed(1)}h` : "—"}
              label="avg sleep"
              tint="bg-g-sky-soft"
            />
          </div>

          {/* Top patterns */}
          {summary.topSymptoms.length > 0 && (
            <Section title="Symptoms you log most" emoji="🩷">
              {summary.topSymptoms.map((s) => (
                <BarRow key={s.option.id} emoji={s.option.emoji} label={s.option.label} count={s.count} total={summary.daysTracked} />
              ))}
            </Section>
          )}
          {summary.topMoods.length > 0 && (
            <Section title="Your mood vibe" emoji="💭">
              {summary.topMoods.map((s) => (
                <BarRow key={s.option.id} emoji={s.option.emoji} label={s.option.label} count={s.count} total={summary.daysTracked} />
              ))}
            </Section>
          )}

          {/* Watch-outs — framed as "tell your gyno", never diagnostic */}
          {summary.watchOuts.length > 0 && (
            <Section title="Worth mentioning to your gyno" emoji="💛">
              <div className="space-y-3">
                {summary.watchOuts.map((w, i) => (
                  <div key={i} className="rounded-2xl bg-g-butter-soft px-4 py-3">
                    <p className="font-cute text-sm font-bold text-g-ink">
                      {w.emoji} {w.title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-g-ink-2">{w.body}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Gyno nudge + PDF CTA */}
          <div className="mt-5 rounded-3xl bg-candy p-5 shadow-girly-pop">
            <p className="font-cute text-lg font-bold text-white">Got a gyno visit coming up? 💕</p>
            <p className="mt-1 text-sm font-semibold text-white/90">
              Turn everything you tracked into a cute, clear PDF to bring along.
            </p>
            <Link
              href="/export"
              className="mt-3 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-g-pink-deep active:scale-95"
            >
              Make my Gyno PDF 📄
            </Link>
          </div>
        </>
      )}
    </PatientShell>
  )
}

function Stat({ emoji, value, label, tint }: { emoji: string; value: string; label: string; tint: string }) {
  return (
    <div className="rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl text-lg ${tint}`}>{emoji}</span>
      <p className="mt-2 font-cute text-2xl font-bold text-g-ink">{value}</p>
      <p className="text-xs font-bold text-g-ink-3">{label}</p>
    </div>
  )
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <h2 className="mb-3 font-cute text-base font-bold text-g-ink">
        {emoji} {title}
      </h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function BarRow({ emoji, label, count, total }: { emoji: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold text-g-ink">
        <span>
          {emoji} {label}
        </span>
        <span className="text-g-ink-3">{count}×</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-g-canvas-2">
        <div className="h-full rounded-full bg-candy" style={{ width: `${Math.max(pct, 6)}%` }} />
      </div>
    </div>
  )
}
