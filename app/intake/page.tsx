"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { PolarisLogo } from "@/components/logo"

type Step = {
  id: string
  question: string
  helper?: string
  type: "single" | "multi" | "text" | "photos"
  options?: string[]
  placeholder?: string
  optional?: boolean
}

const STEPS: Step[] = [
  {
    id: "first_name",
    question: "What name should we call you?",
    helper: "Your provider will see this on their dashboard.",
    type: "text",
    placeholder: "First name",
  },
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
    question: "Which of these have you noticed in the last 12 months?",
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
    id: "lab_photos",
    question: "Have any recent bloodwork? Snap a photo.",
    helper:
      "Take a picture of your most recent lab results. Your provider sees it instantly. Skip if you don't have any.",
    type: "photos",
    optional: true,
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

interface UploadedPhoto {
  url: string
  path: string
  uploading?: boolean
  error?: string
  localPreview?: string
}

export default function IntakePage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  function updateText(value: string) {
    setAnswers((a) => ({ ...a, [step.id]: value }))
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = "" // allow re-selecting the same file
    for (const file of files) {
      const localPreview = URL.createObjectURL(file)
      const placeholder: UploadedPhoto = {
        url: "",
        path: "",
        uploading: true,
        localPreview,
      }
      setPhotos((p) => [...p, placeholder])

      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload-lab", { method: "POST", body: fd })
        const body = (await res.json()) as
          | { url: string; path: string }
          | { error: string }
        if (!res.ok || !("url" in body)) {
          setPhotos((p) =>
            p.map((ph) =>
              ph.localPreview === localPreview
                ? { ...ph, uploading: false, error: "error" in body ? body.error : "Upload failed" }
                : ph
            )
          )
        } else {
          setPhotos((p) =>
            p.map((ph) =>
              ph.localPreview === localPreview
                ? { ...ph, url: body.url, path: body.path, uploading: false }
                : ph
            )
          )
        }
      } catch (err) {
        console.error(err)
        setPhotos((p) =>
          p.map((ph) =>
            ph.localPreview === localPreview
              ? { ...ph, uploading: false, error: "Network error" }
              : ph
          )
        )
      }
    }
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index))
  }

  function canAdvance() {
    if (step.optional) return true
    if (step.type === "single") return typeof currentAnswer === "string"
    if (step.type === "multi") return Array.isArray(currentAnswer) && currentAnswer.length > 0
    if (step.type === "text")
      return typeof currentAnswer === "string" && currentAnswer.trim().length > 0
    if (step.type === "photos") return true
    return true
  }

  async function advance() {
    if (stepIndex === STEPS.length - 1) {
      setSubmitting(true)
      const successfulPhotos = photos.filter((p) => p.url && !p.error).map((p) => p.url)
      const finalAnswers = { ...answers, lab_photos: successfulPhotos }
      try {
        await fetch("/api/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: finalAnswers }),
        })
      } catch (err) {
        console.error("Submit failed, continuing to confirmation:", err)
      }
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
    <main className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="border-b border-border-soft bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link href="/">
            <PolarisLogo size={26} withWordmark wordmarkClassName="text-base" />
          </Link>
          <div className="text-xs font-medium text-ink-3">
            Step {stepIndex + 1} of {STEPS.length}
          </div>
        </div>
        <div className="h-1 w-full bg-border-soft/50">
          <div
            className="h-full rounded-r-full bg-brand-gradient transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-12">
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          {step.question}
        </h1>
        {step.helper && <p className="mt-3 text-sm text-ink-2">{step.helper}</p>}
        {step.optional && (
          <p className="mt-2 inline-block self-start rounded-full bg-canvas-tint px-2.5 py-0.5 text-[11px] font-medium text-coral-deep">
            Optional
          </p>
        )}

        <div className="mt-10 flex flex-col gap-3">
          {step.type === "text" && (
            <input
              type="text"
              value={(currentAnswer as string) ?? ""}
              onChange={(e) => updateText(e.target.value)}
              placeholder={step.placeholder}
              autoFocus
              className="w-full rounded-2xl border border-border-strong bg-card px-5 py-5 text-lg font-medium text-ink placeholder-ink-3 outline-none transition focus:border-coral focus:shadow-pop"
            />
          )}

          {step.type === "single" &&
            step.options?.map((opt) => {
              const selected = currentAnswer === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => selectSingle(opt)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left text-sm font-medium transition ${
                    selected
                      ? "border-coral bg-coral-soft/40 text-plum shadow-pop ring-2 ring-coral-soft"
                      : "border-border-strong bg-card text-ink hover:border-coral/60 hover:bg-canvas-tint"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    {opt}
                    {selected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coral text-white">
                        <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 8.5 6 12l7.5-7.5" />
                        </svg>
                      </span>
                    )}
                  </span>
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
                  className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left text-sm font-medium transition ${
                    selected
                      ? "border-coral bg-coral-soft/40 text-plum shadow-pop ring-2 ring-coral-soft"
                      : "border-border-strong bg-card text-ink hover:border-coral/60 hover:bg-canvas-tint"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      selected ? "border-coral bg-coral text-white" : "border-border-strong bg-card"
                    }`}
                  >
                    {selected && (
                      <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 8.5 6 12l7.5-7.5" />
                      </svg>
                    )}
                  </span>
                  <span>{opt}</span>
                </button>
              )
            })}

          {step.type === "photos" && (
            <div className="space-y-4">
              {/* Existing photos */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-border-strong bg-canvas-tint"
                    >
                      {(photo.url || photo.localPreview) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.url || photo.localPreview!}
                          alt="Lab result"
                          className="h-full w-full object-cover"
                        />
                      )}
                      {photo.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-canvas/70 backdrop-blur-sm">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-coral border-t-transparent" />
                        </div>
                      )}
                      {photo.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-coral/90 p-2 text-center text-[10px] font-medium text-white">
                          {photo.error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Remove photo"
                      >
                        <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-card px-6 py-12 text-center transition hover:border-coral/60 hover:bg-canvas-tint"
              >
                <div className="bg-brand-gradient flex h-12 w-12 items-center justify-center rounded-full shadow-pop">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div className="font-display text-base font-medium tracking-tight text-ink">
                  {photos.length === 0 ? "Take a photo" : "Add another"}
                </div>
                <p className="text-xs text-ink-3">
                  Camera or photo library. Up to 10 MB per image.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </button>

              <p className="rounded-2xl bg-canvas-tint p-4 text-[11px] leading-relaxed text-ink-3">
                <span className="font-medium text-plum">Your photos are private.</span> Only your
                provider sees them. Skip if you don't have recent labs — you can always add them
                later.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border-soft bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            className="text-sm font-medium text-ink-3 transition hover:text-ink disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance() || submitting}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-canvas shadow-pop transition hover:bg-plum disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
          >
            {submitting
              ? "Submitting…"
              : step.optional && (currentAnswer === undefined && photos.length === 0)
              ? "Skip"
              : stepIndex === STEPS.length - 1
              ? "Submit"
              : "Continue"}
            {!submitting && (
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            )}
          </button>
        </div>
      </footer>
    </main>
  )
}
