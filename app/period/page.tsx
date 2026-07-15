"use client"

import { useCallback, useEffect, useState } from "react"
import { Droplet } from "lucide-react"
import { PatientShell } from "@/components/patient-shell"
import { CycleCalendar } from "@/components/cycle-calendar"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"
import { getAllEntriesAsync, saveEntryAsync } from "@/lib/tracker-store"
import {
  canPredictCycle,
  computeCycle,
  cycleHistory,
  deriveLastPeriodStart,
  type CycleHistory,
  type CycleStatus,
} from "@/lib/cycle"
import { getProfile, hydrateProfileFromMetadata, saveProfile, type CycleProfile } from "@/lib/profile"
import { FLOW_OPTIONS, toDateKey, type TrackEntry } from "@/lib/tracker"

function fmt(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function PeriodPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<TrackEntry[]>([])
  const [profile, setProfile] = useState<CycleProfile>({})
  const [cycle, setCycle] = useState<CycleStatus | null>(null)
  const [history, setHistory] = useState<CycleHistory | null>(null)

  const load = useCallback(async () => {
    if (user?.user_metadata?.cycle) hydrateProfileFromMetadata(user.user_metadata.cycle)
    const prof = getProfile()
    setProfile(prof)
    const all = await getAllEntriesAsync()
    setEntries(all)
    const hist = cycleHistory(all)
    setHistory(hist)
    const anchor = deriveLastPeriodStart(all)
    setCycle(computeCycle(prof, anchor, toDateKey(new Date()), hist.average, false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const today = toDateKey(new Date())
  const todayEntry = entries.find((e) => e.date === today)
  const onPeriod = !!(todayEntry?.flow && todayEntry.flow !== "none")

  async function setFlow(flow: string) {
    const existing = entries.find((e) => e.date === today) ?? { date: today }
    await saveEntryAsync({ ...existing, date: today, flow: flow as TrackEntry["flow"] })
    await load()
  }
  async function setLastPeriodStart(v: string) {
    const prof = getProfile()
    saveProfile({ ...prof, lastPeriodStart: v || undefined })
    await load()
  }
  async function togglePeriod(date: string, make: boolean) {
    const existing = entries.find((e) => e.date === date) ?? { date }
    await saveEntryAsync({ ...existing, date, flow: make ? "medium" : "none" })
    await load()
  }
  async function logRange(start: string, end: string) {
    let d = new Date(start + "T00:00:00")
    const endD = new Date(end + "T00:00:00")
    while (d <= endD) {
      const dk = toDateKey(d)
      const ex = entries.find((e) => e.date === dk) ?? { date: dk }
      await saveEntryAsync({ ...ex, date: dk, flow: "medium" })
      d = new Date(d.getTime() + 86_400_000)
    }
    await load()
  }

  const anchor = deriveLastPeriodStart(entries)
  const flowChoices = FLOW_OPTIONS.filter((f) => f.id !== "none")
  const canPredict = history ? canPredictCycle(history, profile) : false

  // Prediction line — only when we have enough logged cycles (no guessing).
  let estimate =
    "PMOS cycles are often irregular, so MyPMOS won't guess your next period yet. Log a couple of cycles and predictions will appear here."
  if (canPredict && cycle && cycle.cycleDay !== null) {
    estimate = cycle.isLate
      ? `Your period is ~${cycle.daysLate} day${cycle.daysLate === 1 ? "" : "s"} later than your average.`
      : `Estimated to start in ~${cycle.nextPeriodInDays} day${cycle.nextPeriodInDays === 1 ? "" : "s"}${
          cycle.nextPeriodDate ? ` · around ${fmt(cycle.nextPeriodDate)}` : ""
        }.`
  }

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-g-pink-soft">
          <Droplet size={18} className="text-g-pink-deep" />
        </span>
        <div>
          <h1 className="font-cute text-2xl text-g-ink">Period tracker</h1>
          <p className="text-sm font-medium text-g-ink-3">Log your period and see what&apos;s coming</p>
        </div>
      </div>

      {/* Status / start-stop */}
      <section className="mt-4 rounded-2xl border border-g-border bg-white p-5 shadow-girly">
        {onPeriod ? (
          <>
            <p className="font-cute text-lg text-g-ink">You&apos;re on your period 🌹</p>
            <p className="mt-0.5 text-sm font-medium text-g-ink-3">How&apos;s your flow today?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {flowChoices.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFlow(f.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-95",
                    todayEntry?.flow === f.id ? "border-transparent bg-g-pink text-white" : "border-g-border bg-white text-g-ink-2"
                  )}
                >
                  {f.emoji} {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFlow("none")}
              className="mt-3 w-full rounded-full border border-g-border bg-white py-3 text-sm font-bold text-g-ink-2 active:scale-[0.98]"
            >
              End period
            </button>
          </>
        ) : (
          <>
            <p className="font-cute text-lg text-g-ink">Not on your period today</p>
            <p className="mt-0.5 text-sm font-medium text-g-ink-3">{estimate}</p>
            <button
              onClick={() => setFlow("medium")}
              className="mt-3 w-full rounded-full bg-candy py-3 font-cute text-base text-white shadow-girly-pop active:scale-[0.98]"
            >
              🩸 Start my period
            </button>
          </>
        )}
      </section>

      {/* Correct the anchor date that drives predictions */}
      <section className="mt-4 rounded-2xl border border-g-border bg-white p-4 shadow-girly">
        <p className="text-sm font-semibold text-g-ink">When did your last period actually start?</p>
        <p className="mt-0.5 text-xs font-medium text-g-ink-3">
          This is what your predictions are based on — fix it here if it&apos;s wrong.
        </p>
        <input
          type="date"
          value={profile.lastPeriodStart ?? ""}
          max={today}
          onChange={(e) => setLastPeriodStart(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none focus:border-g-pink"
        />
        {profile.lastPeriodStart && (
          <button
            onClick={() => setLastPeriodStart("")}
            className="mt-2 text-xs font-bold text-g-ink-3 active:scale-95"
          >
            I&apos;m not sure / haven&apos;t had one recently — clear this
          </button>
        )}
      </section>

      {/* History stats */}
      {history && history.count > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Avg cycle" value={history.average ? `${history.average}d` : "—"} />
          <Stat label="Avg period" value={history.averagePeriod ? `${history.averagePeriod}d` : "—"} />
          <Stat label="Regularity" value={history.regularity === "unknown" ? "—" : history.regularity} />
        </div>
      )}

      {/* Logging calendar */}
      <div className="mt-4">
        <p className="mb-2 px-1 text-xs font-semibold text-g-ink-3">
          Tap a day to mark or unmark your period, or log a whole period as a range.
        </p>
        <CycleCalendar entries={entries} profile={profile} anchor={anchor} onTogglePeriod={togglePeriod} onLogRange={logRange} showPredictions={canPredict} />
      </div>

      <p className="mt-5 px-2 text-center text-xs font-semibold text-g-ink-3">
        Predictions are estimates from your own history, not medical advice. 💗
      </p>
    </PatientShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-g-border bg-white px-2 py-3 shadow-girly">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-g-ink-3">{label}</p>
      <p className="mt-0.5 font-cute text-base capitalize text-g-ink">{value}</p>
    </div>
  )
}
