"use client"

import { useEffect, useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import {
  GOAL_CATEGORIES,
  MAX_GOALS,
  addGoal,
  getGoals,
  goalMeta,
  isCheckedToday,
  lastSevenDays,
  removeGoal,
  streak,
  toggleCheckIn,
  type Goal,
  type GoalCategory,
} from "@/lib/goals"

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setGoals(getGoals())
  }, [])

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">🎯</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">My goals</h1>
          <p className="text-sm font-semibold text-g-ink-3">Your two most important goals, one day at a time 💕</p>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">
        Tip: at the end of a doctor visit, pick the two things you most want to work on and set them here.
      </p>

      <div className="mt-4 space-y-3">
        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onCheck={() => setGoals(toggleCheckIn(g.id))}
            onRemove={() => setGoals(removeGoal(g.id))}
          />
        ))}
      </div>

      {goals.length < MAX_GOALS &&
        (adding ? (
          <AddGoal
            onAdded={() => {
              setGoals(getGoals())
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 w-full rounded-2xl border border-dashed border-g-pink bg-white px-4 py-4 text-sm font-bold text-g-pink-deep active:scale-[0.99]"
          >
            ＋ {goals.length === 0 ? "Set your first goal" : "Add your second goal"}
          </button>
        ))}

      {goals.length >= MAX_GOALS && (
        <p className="mt-4 px-2 text-center text-xs font-semibold text-g-ink-3">
          Two goals is the sweet spot. Reach these and you can always swap in new ones 🌷
        </p>
      )}
    </PatientShell>
  )
}

function GoalCard({ goal, onCheck, onRemove }: { goal: Goal; onCheck: () => void; onRemove: () => void }) {
  const meta = goalMeta(goal.category)
  const done = isCheckedToday(goal)
  const s = streak(goal)
  const week = lastSevenDays(goal)
  const weekCount = week.filter((d) => d.done).length

  return (
    <div className="rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-candy-soft text-xl">{meta.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-cute text-base font-bold leading-snug text-g-ink">{goal.title}</p>
          {goal.target && <p className="text-xs font-bold text-g-ink-3">{goal.target}</p>}
          <p className="mt-0.5 text-xs font-semibold text-g-ink-3">
            {s > 0 ? `🔥 ${s}-day streak · ` : ""}
            {weekCount}/7 this week
          </p>
        </div>
        <button onClick={onRemove} className="shrink-0 text-xs font-bold text-g-ink-3 active:scale-90" aria-label="Remove goal">
          ✕
        </button>
      </div>

      {/* 7-day dots */}
      <div className="mt-3 flex items-center justify-between px-1">
        {week.map((d, i) => (
          <span
            key={i}
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full text-[0.7rem] font-bold",
              d.done ? "bg-candy text-white" : "bg-g-canvas text-g-ink-3"
            )}
            title={d.date}
          >
            {d.done ? "✓" : ""}
          </span>
        ))}
      </div>

      <button
        onClick={onCheck}
        className={cn(
          "mt-3 w-full rounded-full py-3 font-cute text-base font-bold transition active:scale-[0.98]",
          done ? "bg-candy-soft text-g-pink-deep" : "bg-candy text-white shadow-girly-pop"
        )}
      >
        {done ? "✓ Done today" : "Mark done today"}
      </button>
    </div>
  )
}

function AddGoal({ onAdded, onCancel }: { onAdded: () => void; onCancel: () => void }) {
  const [cat, setCat] = useState<GoalCategory>("exercise")
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [error, setError] = useState<string | null>(null)
  const meta = goalMeta(cat)

  function add() {
    const res = addGoal({ title: title || meta.suggestion || "", category: cat, target })
    if (res.error) {
      setError(res.error)
      return
    }
    onAdded()
  }

  return (
    <div className="mt-3 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <p className="font-cute text-sm font-bold text-g-ink">What do you want to work on?</p>
      <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
        {GOAL_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCat(c.id)
              if (!title) setTitle("")
            }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition active:scale-95",
              cat === c.id ? "border-transparent bg-candy text-white" : "border-g-border bg-g-canvas text-g-ink-2"
            )}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {meta.hint && <p className="mt-2 rounded-2xl bg-g-mint-soft px-3 py-2 text-xs font-semibold text-g-ink">💡 {meta.hint}</p>}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={meta.suggestion || "My goal"}
        className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 font-cute text-base font-bold text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
      <input
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        placeholder="Target (optional), e.g. 150 min / week"
        className="mt-2 w-full rounded-2xl border border-g-border bg-g-canvas px-4 py-3 text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3 focus:border-g-pink"
      />
      {error && <p className="mt-2 text-xs font-bold text-g-pink-deep">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={add} className="rounded-full bg-candy px-5 py-2.5 text-sm font-bold text-white active:scale-95">
          Set this goal
        </button>
        <button onClick={onCancel} className="rounded-full border border-g-border bg-white px-5 py-2.5 text-sm font-bold text-g-ink-2 active:scale-95">
          Cancel
        </button>
      </div>
    </div>
  )
}
