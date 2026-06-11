"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Step = {
  id: string
  question: string
  helper?: string
  type: "single" | "multi" | "text" | "number"
  options?: string[]
}

const STEPS: Step[] = [
  {
    id: "primary_concern",
    question: "What brings you in today?",
    helper: "Pick the closest match. You can add details next.",
    type: "single",
    options: [
      "Irregular or missed periods",
      "Acne, hair growth, or hair loss",
      "Weight gain or trouble losing weight",
      "Trying to conceive",
      "General hormone check / second opinion",
    ],
  },
  {
    id: "cycle_length",
    question: "How long is your typical cycle?",
    helper: "From day 1 of one period to day 1 of the next.",
    type: "single",
    options: [
      "Less than 21 days",
      "21 to 35 days (typical)",
      "More than 35 days",
      "Not predictable",
      "No period for 3+ months",
    ],
  },
  {
    id: "symptoms",
    question: "Which of these have you experienced in the last 12 months?",
    helper: "Select all that apply.",
    type: "multi",
    options: [
      "Coarse hair on chin, jawline, chest, or stomach",
      "Adult acne (especially jawline)",
      "Hair thinning at the crown or part",
      "Skin tags on neck or underarms",
      "Dark velvety patches on neck or armpits",
      "Sugar cravings or energy crashes after meals",
      "Difficulty losing weight despite effort",
      "Mood swings, anxiety, or low mood",
    ],
  },
  {
    id: "family_history",
    question: "Do any family members have these conditions?",
    helper: "Select all that apply.",
    type: "multi",
    options: [
      "PCOS",
      "Type 2 diabetes",
      "Gestational diabetes",
      "Early heart disease",
      "Thyroid disorder",
      "None that I know of",
    ],
  },
  {
    id: "goals",
    question: "What matters most to you right now?",
    helper: "Choose your top priority. Others can be addressed later.",
    type: "single",
    options: [
      "Understand what is happening to my body",
      "Manage acne, hair, or skin symptoms",
      "Reach a healthy weight",
      "Plan for pregnancy",
      "Lower my long-term health risks",
    ],
  },
]

export default function IntakePage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  const step = STEPS[stepIndex]
  const progress = ((stepIndex + 1) / STEPS.length) * 100
  const currentAnswer = answers[step.id]

  function selectSingle(value: string) {
    setAnswers((a) => ({ ...a, [step.id]: value }))
  }

  function toggleMulti(value: string) {
    const existing = (answers[step.id] as string[]) ?? []
    const next = existing.includes(value)
      ? existing.filter((v) => v !== value)
      : [...existing, value]
    setAnswers((a) => ({ ...a, [step.id]: next }))
  }

  function canAdvance() {
    if (step.type === "single") return typeof currentAnswer === "string"
    if (step.type === "multi") return Array.isArray(currentAnswer) && currentAnswer.length > 0
    return true
  }

  function advance() {
    if (stepIndex === STEPS.length - 1) {
      router.push("/intake/complete")
      return
    }
    setStepIndex((i) => i + 1)
  }

  function back() {
    if (stepIndex === 0) return
    setStepIndex((i) => i - 1)
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-teal-400" />
            <span className="text-sm font-semibold tracking-tight">Polaris</span>
          </Link>
          <div className="text-xs font-medium text-slate-500">
            Step {stepIndex + 1} of {STEPS.length}
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-10">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{step.question}</h1>
        {step.helper && <p className="mt-2 text-sm text-slate-500">{step.helper}</p>}

        <div className="mt-8 flex flex-col gap-3">
          {step.type === "single" &&
            step.options?.map((opt) => {
              const selected = currentAnswer === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => selectSingle(opt)}
                  className={`w-full rounded-xl border px-4 py-4 text-left text-sm transition ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              )
            })}

          {step.type === "multi" &&
            step.options?.map((opt) => {
              const list = (currentAnswer as string[]) ?? []
              const selected = list.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleMulti(opt)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left text-sm transition ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      selected
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected && (
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="h-3 w-3"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.5 8.5 6 12l7.5-7.5" />
                      </svg>
                    )}
                  </span>
                  <span>{opt}</span>
                </button>
              )
            })}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            className="text-sm font-medium text-slate-500 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance()}
            className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {stepIndex === STEPS.length - 1 ? "Submit" : "Continue"}
          </button>
        </div>
      </footer>
    </main>
  )
}
