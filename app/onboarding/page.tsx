"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { GirlyLogo } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import { CONCERNS, GOALS, getProfile, saveProfile, type CycleProfile, type Goal } from "@/lib/profile"
import { toDateKey } from "@/lib/tracker"

const CYCLE_OPTIONS: { label: string; value: number; irregular?: boolean }[] = [
  { label: "21–24 days", value: 23 },
  { label: "25–28 days", value: 27 },
  { label: "29–31 days", value: 30 },
  { label: "32–35 days", value: 33 },
  { label: "Over 35 days", value: 40 },
  { label: "It varies a lot", value: 30, irregular: true },
]

const TODAY = toDateKey(new Date())

export default function OnboardingPage() {
  const router = useRouter()
  const existing = useMemo(() => getProfile(), [])
  const [step, setStep] = useState(0)
  const [p, setP] = useState<CycleProfile>({
    periodLength: 5,
    ...existing,
  })

  const STEPS = 6
  const set = (patch: Partial<CycleProfile>) => setP((prev) => ({ ...prev, ...patch }))

  function finish() {
    const goals = p.goals ?? (p.goal ? [p.goal] : [])
    saveProfile({ ...p, goals, goal: goals[0] ?? p.goal, completedAt: Date.now() })
    router.push("/")
  }

  function toggleGoal(id: Goal) {
    const cur = p.goals ?? (p.goal ? [p.goal] : [])
    const next = cur.includes(id)
      ? cur.filter((g) => g !== id)
      : cur.length >= 3
        ? cur // cap at three so the app stays focused
        : [...cur, id]
    set({ goals: next, goal: next[0] })
  }

  const canContinue =
    step === 0 ? true : // name optional
    step === 1 ? true : // last period optional ("not sure")
    step === 2 ? !!p.cycleLength :
    step === 3 ? !!p.periodLength :
    step === 4 ? (p.goals?.length ?? 0) > 0 :
    true // concerns optional

  function next() {
    if (step < STEPS - 1) setStep(step + 1)
    else finish()
  }

  return (
    <div className="bg-girly font-round flex min-h-screen flex-col text-g-ink">
      {/* Header + progress */}
      <header className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <GirlyLogo size={26} />
          <span className="text-sm font-bold text-g-ink-3">
            {step + 1} of {STEPS}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-candy transition-all"
            style={{ width: `${((step + 1) / STEPS) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6">
        {step === 0 && (
          <Step emoji="🌸" title="Hi! What should we call you?" sub="So MyPMOS feels like yours.">
            <input
              autoFocus
              value={p.name ?? ""}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Your first name"
              className="w-full rounded-2xl border border-g-border bg-white px-4 py-3.5 text-base font-semibold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
            />
          </Step>
        )}

        {step === 1 && (
          <Step emoji="🩷" title="When did your last period start?" sub="A rough date is totally fine.">
            <input
              type="date"
              max={TODAY}
              value={p.lastPeriodStart ?? ""}
              onChange={(e) => set({ lastPeriodStart: e.target.value })}
              className="w-full rounded-2xl border border-g-border bg-white px-4 py-3.5 text-base font-semibold text-g-ink outline-none focus:border-g-pink"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["Today", 0],
                ["Yesterday", -1],
                ["~1 week ago", -7],
                ["~2 weeks ago", -14],
              ].map(([label, off]) => {
                const d = new Date()
                d.setDate(d.getDate() + (off as number))
                const key = toDateKey(d)
                return (
                  <Chip key={label as string} selected={p.lastPeriodStart === key} onClick={() => set({ lastPeriodStart: key })}>
                    {label as string}
                  </Chip>
                )
              })}
              <Chip selected={p.lastPeriodStart === undefined} onClick={() => set({ lastPeriodStart: undefined })}>
                🤷‍♀️ Not sure
              </Chip>
            </div>
            <p className="mt-3 text-xs font-semibold text-g-ink-3">
              PMOS cycles can be irregular — MyPMOS keeps it gentle and updates as you log.
            </p>
          </Step>
        )}

        {step === 2 && (
          <Step emoji="🗓️" title="How long are your cycles usually?" sub="From the first day of one period to the next.">
            <div className="space-y-2">
              {CYCLE_OPTIONS.map((o) => (
                <SelectRow
                  key={o.label}
                  selected={p.cycleLength === o.value && Boolean(p.cycleIrregular) === Boolean(o.irregular)}
                  onClick={() => set({ cycleLength: o.value, cycleIrregular: Boolean(o.irregular) })}
                >
                  {o.label}
                </SelectRow>
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step emoji="💧" title="How many days does your period last?" sub="On an average month.">
            <div className="rounded-3xl border border-g-border bg-white p-5 shadow-girly">
              <p className="text-center font-cute text-4xl font-bold text-g-ink">
                {p.periodLength} <span className="text-lg font-bold text-g-ink-3">days</span>
              </p>
              <input
                type="range"
                min={2}
                max={9}
                value={p.periodLength ?? 5}
                onChange={(e) => set({ periodLength: Number(e.target.value) })}
                className="mt-4 w-full accent-[var(--g-pink)]"
              />
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step emoji="💫" title="What brought you here?" sub="Pick up to 3. MyPMOS puts these front and center — you can change them anytime.">
            <div className="space-y-2.5">
              {GOALS.map((g) => {
                const sel = (p.goals ?? []).includes(g.id)
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGoal(g.id as Goal)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-3xl border p-4 text-left transition active:scale-[0.99]",
                      sel ? "border-transparent bg-candy text-white shadow-girly-pop" : "border-g-border bg-white"
                    )}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-cute text-base font-bold">{g.label}</span>
                      <span className={cn("text-sm font-semibold", sel ? "text-white/90" : "text-g-ink-3")}>
                        {g.blurb}
                      </span>
                    </span>
                    <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", sel ? "border-white bg-white/20" : "border-g-border-2")}>
                      {sel && <span className="text-sm font-black text-white">✓</span>}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-xs font-semibold text-g-ink-3">
              {(p.goals?.length ?? 0) >= 3 ? "That's 3 — your focus is set. 💕" : "Choose the ones that matter most to you."}
            </p>
          </Step>
        )}

        {step === 5 && (
          <Step emoji="🌷" title="Anything you're dealing with?" sub="Pick any that apply — this shapes your insights.">
            <div className="flex flex-wrap gap-2">
              {CONCERNS.map((c) => {
                const sel = (p.concerns ?? []).includes(c.id)
                return (
                  <Chip
                    key={c.id}
                    selected={sel}
                    onClick={() =>
                      set({
                        concerns: sel
                          ? (p.concerns ?? []).filter((x) => x !== c.id)
                          : [...(p.concerns ?? []), c.id],
                      })
                    }
                  >
                    {c.emoji} {c.label}
                  </Chip>
                )
              })}
            </div>
          </Step>
        )}
      </main>

      {/* Footer nav */}
      <footer className="sticky bottom-0 border-t border-g-border/60 bg-g-canvas/85 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))}
            className="text-sm font-bold text-g-ink-3 active:scale-95"
          >
            ← Back
          </button>
          <button
            onClick={next}
            disabled={!canContinue}
            className="rounded-full bg-candy px-7 py-3 font-cute text-base font-bold text-white shadow-girly-pop transition active:scale-95 disabled:opacity-50"
          >
            {step === STEPS - 1 ? "All done 💕" : "Continue"}
          </button>
        </div>
      </footer>
    </div>
  )
}

function Step({ emoji, title, sub, children }: { emoji: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="animate-pop">
      <span className="text-4xl">{emoji}</span>
      <h1 className="mt-3 font-cute text-2xl font-bold leading-tight text-g-ink">{title}</h1>
      <p className="mt-1 text-sm font-semibold text-g-ink-3">{sub}</p>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
        selected ? "border-transparent bg-candy text-white shadow-girly" : "border-g-border bg-white text-g-ink-2"
      )}
    >
      {children}
    </button>
  )
}

function SelectRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left font-bold transition active:scale-[0.99]",
        selected ? "border-transparent bg-candy text-white shadow-girly" : "border-g-border bg-white text-g-ink"
      )}
    >
      <span>{children}</span>
      <span className={cn("grid h-5 w-5 place-items-center rounded-full border-2", selected ? "border-white" : "border-g-border-2")}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
      </span>
    </button>
  )
}
