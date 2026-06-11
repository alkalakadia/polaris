import Link from "next/link"
import { notFound } from "next/navigation"
import { PolarisLogo } from "@/components/logo"
import { generateHandout } from "@/lib/anthropic"
import { getPatientById } from "@/lib/sample-data"

export const dynamic = "force-dynamic"

export default async function HandoutPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const patient = getPatientById(patientId)
  if (!patient) notFound()

  const startedAt = Date.now()
  const content = await generateHandout(patient)
  const generatedInMs = Date.now() - startedAt
  const aiPowered = Boolean(process.env.ANTHROPIC_API_KEY)

  return (
    <main className="min-h-screen bg-canvas-tint text-ink">
      <header className="sticky top-0 z-10 border-b border-border-soft bg-canvas-tint/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/provider/${patient.id}`} className="text-sm font-medium text-ink-3 transition hover:text-ink">
              ← Chart
            </Link>
            <div className="h-5 w-px bg-border-soft" />
            <span className="font-display text-sm font-medium tracking-tight">Handout</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                aiPowered
                  ? "bg-sage/15 text-sage"
                  : "bg-peach-soft text-coral-deep"
              }`}
            >
              {aiPowered
                ? `generated in ${(generatedInMs / 1000).toFixed(1)}s`
                : "phenotype template"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`mailto:?subject=Your visit summary&body=Hi ${patient.firstName}, attached is your visit summary.`}
              className="rounded-full border border-border-strong bg-card px-3.5 py-1.5 text-xs font-medium text-ink-2 shadow-soft transition hover:bg-canvas-tint"
            >
              Email
            </a>
            <button
              type="button"
              className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-canvas shadow-pop transition hover:bg-plum"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
        <article className="rounded-3xl border border-border-soft bg-card p-12 shadow-card print:rounded-none print:border-0 print:shadow-none">
          {/* Letterhead */}
          <header className="flex items-center justify-between border-b border-border-soft pb-6">
            <div className="flex items-center gap-2">
              <PolarisLogo size={28} />
              <div>
                <div className="font-display text-lg font-medium tracking-tight">polaris</div>
                <div className="text-[11px] text-ink-3">
                  UW Health Women's Clinic · Dr. Sarah Chen
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-ink-3">
              For: {patient.firstName}, age {patient.age}
              <br />
              Visit date: Today
            </div>
          </header>

          <div className="mt-10">
            <h1 className="font-display text-3xl font-medium leading-tight tracking-tight">
              {content.title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">{content.intro}</p>
          </div>

          <section className="mt-10">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-coral-deep">
              What we think is going on
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">{content.phenotypeExplanation}</p>
          </section>

          <section className="mt-10">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-coral-deep">
              Your next steps
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-ink">
              {content.nextSteps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="bg-brand-gradient mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-coral-deep">
              Three questions to bring to your next visit
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink">
              {content.questionsToAsk.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl bg-canvas-tint p-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-coral-deep">
              Lifestyle, matched to your phenotype
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">{content.lifestyleIntro}</p>
            <ul className="mt-4 space-y-3 text-sm text-ink">
              {content.lifestyleRecommendations.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-plum" />
                  <span className="leading-relaxed">
                    <span className="font-semibold">{r.title}.</span> {r.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 border-t border-border-soft pt-5 text-[11px] leading-relaxed text-ink-3">
            <p>
              <strong>Sources:</strong> Endocrine Society Clinical Practice Guidelines 2023,
              Rotterdam ESHRE/ASRM-Sponsored PCOS Consensus Workshop Group 2018, AE-PCOS Society
              2009.
            </p>
            <p className="mt-2">
              This handout is a summary of today's discussion. It is not a substitute for medical
              advice. Call our office at (608) 263-6240 with questions or concerns.
            </p>
          </section>
        </article>
      </section>
    </main>
  )
}
