import Link from "next/link"
import { PolarisLogo } from "@/components/logo"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Top nav */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <PolarisLogo size={32} withWordmark />
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/intake"
              className="rounded-full px-4 py-2 text-ink-2 transition hover:bg-canvas-tint hover:text-ink"
            >
              Patient intake
            </Link>
            <Link
              href="/provider"
              className="rounded-full bg-ink px-4 py-2 text-sm text-canvas shadow-soft transition hover:bg-plum"
            >
              Provider view
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card/60 px-3.5 py-1 text-xs font-medium text-plum backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            UW Madison SAIL 2026 · Built for OB/GYNs
          </div>

          <h1 className="font-display mt-7 text-5xl font-medium leading-[1.05] sm:text-6xl md:text-7xl">
            The PCOS workflow tool every OB/GYN <span className="text-brand-gradient italic">should already have</span>.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-2">
            One in ten women have PCOS. The average diagnosis takes four to seven years.
            Polaris turns a five-minute intake into a single screen with phenotype, recommended
            workup, and a personalized handout, ready before she sits down.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/provider"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-canvas shadow-pop transition hover:bg-plum"
            >
              See the provider view
              <svg
                className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <Link
              href="/intake"
              className="rounded-full border border-border-strong bg-card px-6 py-3.5 text-sm font-medium text-ink shadow-soft transition hover:bg-canvas-tint"
            >
              Try the patient intake
            </Link>
          </div>
        </div>
      </section>

      {/* Feature bento */}
      <section className="bg-canvas px-6 pb-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCard
            stage="01"
            stageColor="from-peach to-coral"
            title="Patient intake, on her phone"
            description="A five-minute SMS-linked questionnaire covering cycle history, symptoms, family history, and existing labs. Mobile-first. No app install."
          />
          <FeatureCard
            stage="02"
            stageColor="from-coral to-rose"
            title="Phenotype + workup in one screen"
            description="Rotterdam classification with reasoning, insulin resistance likelihood, and a prioritized lab workup with evidence citations. Ready before you walk in the room."
          />
          <FeatureCard
            stage="03"
            stageColor="from-rose to-plum"
            title="Personalized patient handout"
            description="A one-click handout matched to her phenotype, lifestyle, and goals. Printable, emailable, ready to hand off at the end of the appointment."
          />
        </div>
      </section>

      {/* Why this exists */}
      <section className="bg-canvas-tint px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-coral-deep">
            Why we are building this
          </p>
          <h2 className="font-display mt-3 text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            The OB/GYN front door is the bottleneck.
          </h2>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-ink-2">
            <p>
              The OB/GYN sees three to five possible PCOS cases a week with twelve minutes per visit
              and no decision support built for the condition. UpToDate is a reference book. Epic
              has no PCOS module. The Endocrine Society guideline is forty-seven pages. Meanwhile
              her patient walked in with a TikTok-driven hypothesis.
            </p>
            <p>
              Polaris is not a consumer app. It is the workflow tool that captures structured
              patient input before the visit, runs Rotterdam classification and an insulin
              resistance likelihood score against published criteria, and generates a personalized
              patient handout in seconds. The doctor looks smart. The patient feels heard. The path
              to evidence-based care collapses from fourteen weeks to one visit.
            </p>
            <p>
              We are looking for ten OB/GYNs to give us twenty-five minutes of feedback on this
              prototype this summer. If that is you,{" "}
              <a
                href="mailto:alka.lakadia@wiscai.com"
                className="font-medium text-coral-deep underline decoration-coral decoration-2 underline-offset-4 transition hover:text-plum"
              >
                say hello
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-soft bg-canvas px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <PolarisLogo size={24} withWordmark wordmarkClassName="text-base" />
          <p className="max-w-md text-xs leading-relaxed text-ink-3">
            Polaris is a clinical decision support prototype. It does not diagnose or treat.
            Always apply clinical judgment. Built at UW Madison Summer of AI Lab 2026.
          </p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  stage,
  stageColor,
  title,
  description,
}: {
  stage: string
  stageColor: string
  title: string
  description: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border-soft bg-card p-7 shadow-soft transition hover:shadow-card">
      <div className="flex items-start justify-between">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${stageColor} text-[10px] font-semibold text-white`}>
          {stage}
        </span>
      </div>
      <h3 className="font-display mt-5 text-xl font-medium tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{description}</p>
    </div>
  )
}
