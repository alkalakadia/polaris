/**
 * Health goals — the post-visit "top 2 goals" loop.
 *
 * Dr. Sood (clinical interview) twice recommended helping patients set and
 * track their two most important goals at the end of a clinic visit. This is
 * the lightest possible version: up to two active goals, a daily/weekly check
 * in, and a streak. It doubles as a retention loop (the hardest problem from
 * the Abbott analysis) by giving the user a small, daily reason to return.
 *
 * Stored in localStorage (consistent with the profile), so it works offline
 * and needs no migration. Swap for Supabase later without touching the UI.
 */

import { toDateKey, type DateKey } from "@/lib/tracker"

export type GoalCategory = "exercise" | "nutrition" | "appointment" | "medication" | "sleep" | "other"

export interface Goal {
  id: string
  title: string
  category: GoalCategory
  /** Optional concrete target, e.g. "150 min / week" or "3x / week". */
  target?: string
  createdAt: number
  /** Dates the user marked this done. */
  checkIns: DateKey[]
}

export interface GoalMeta {
  id: GoalCategory
  label: string
  emoji: string
  /** Evidence-based hint from the 2023 international PMOS guidelines. */
  hint?: string
  suggestion?: string
}

/** Categories with guideline-anchored hints (2023 international guidelines). */
export const GOAL_CATEGORIES: GoalMeta[] = [
  {
    id: "exercise",
    label: "Movement",
    emoji: "🏃‍♀️",
    hint: "Guidelines suggest 150-300 min of moderate activity per week.",
    suggestion: "Move 30 min, 5 days a week",
  },
  {
    id: "nutrition",
    label: "Food",
    emoji: "🥗",
    hint: "No single PMOS diet is proven best. Aim for balanced, whole foods you can keep up.",
    suggestion: "Add a protein + veg to breakfast",
  },
  {
    id: "appointment",
    label: "Appointment",
    emoji: "🩺",
    hint: "Book and prep for the visit that keeps stalling.",
    suggestion: "Book my primary care visit",
  },
  {
    id: "medication",
    label: "Meds / supplements",
    emoji: "💊",
    hint: "Consistency is what makes them work.",
    suggestion: "Take my meds at the same time daily",
  },
  {
    id: "sleep",
    label: "Sleep",
    emoji: "😴",
    hint: "Better sleep supports mood and insulin sensitivity.",
    suggestion: "Lights out by 11pm",
  },
  { id: "other", label: "Something else", emoji: "🎯", suggestion: "" },
]

export function goalMeta(id: GoalCategory): GoalMeta {
  return GOAL_CATEGORIES.find((c) => c.id === id) ?? GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1]
}

export const MAX_GOALS = 2

const KEY = "polaris.goals.v1"

export function getGoals(): Goal[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as Goal[]) : []
    return Array.isArray(arr) ? arr.slice(0, MAX_GOALS) : []
  } catch {
    return []
  }
}

function save(goals: Goal[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(goals.slice(0, MAX_GOALS)))
  } catch {
    /* ignore quota errors */
  }
}

export function addGoal(input: { title: string; category: GoalCategory; target?: string }): { goal?: Goal; error?: string } {
  const goals = getGoals()
  if (goals.length >= MAX_GOALS) return { error: "Keep it to your two most important goals. Remove one to add another." }
  if (!input.title.trim()) return { error: "Give your goal a name." }
  const goal: Goal = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title.trim(),
    category: input.category,
    target: input.target?.trim() || undefined,
    createdAt: Date.now(),
    checkIns: [],
  }
  save([...goals, goal])
  return { goal }
}

export function removeGoal(id: string): Goal[] {
  const next = getGoals().filter((g) => g.id !== id)
  save(next)
  return next
}

/** Toggle today's (or a given day's) check-in. Returns the updated goals. */
export function toggleCheckIn(id: string, date: DateKey = toDateKey(new Date())): Goal[] {
  const goals = getGoals().map((g) => {
    if (g.id !== id) return g
    const has = g.checkIns.includes(date)
    return { ...g, checkIns: has ? g.checkIns.filter((d) => d !== date) : [...g.checkIns, date] }
  })
  save(goals)
  return goals
}

export function isCheckedToday(goal: Goal): boolean {
  return goal.checkIns.includes(toDateKey(new Date()))
}

/** Consecutive-day streak ending today (or yesterday, so a missed today doesn't reset it instantly). */
export function streak(goal: Goal): number {
  const set = new Set(goal.checkIns)
  let n = 0
  const d = new Date()
  // allow the streak to count from yesterday if today isn't logged yet
  if (!set.has(toDateKey(d))) d.setDate(d.getDate() - 1)
  while (set.has(toDateKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

/** Check-ins in the trailing 7 days (for the weekly dots + count). */
export function lastSevenDays(goal: Goal): { date: DateKey; done: boolean }[] {
  const set = new Set(goal.checkIns)
  const out: { date: DateKey; done: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = toDateKey(d)
    out.push({ date: key, done: set.has(key) })
  }
  return out
}
