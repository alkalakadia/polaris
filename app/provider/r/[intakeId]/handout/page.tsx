import Link from "next/link"
import { notFound } from "next/navigation"
import { generateHandout } from "@/lib/anthropic"
import { type Phenotype, type SamplePatient } from "@/lib/sample-data"
import { getIntakeById } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function RealHandoutPage({
  params,
}: {
  params: Promise<{ intakeId: string }>
}) {
  const { intakeId } = await params
  const intake = await getIntakeById(intakeId)
  if (!intake) notFound()

  // Adapt the real intake into a SamplePatient-ish shape so we can
  // reuse generateHandout. V2 swaps this for a richer real-patient model.
  const patientLike: SamplePatient = adaptIntakeToPatient(intake.id, intake.intake_data, intake.classification)

  const startedAt = Date.now()
  const content = await generateHandout(patientLike)
  const generatedInMs = Date.now() - startedAt
  const aiPowered = Boolean(process.env.ANTHROPIC_API_KEY)

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/provider/r/${intake.id}`}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              ← Chart
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <span className="text-sm font-semibold tracking-tight">Polaris handout</span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                aiPowered
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {aiPowered
                ? `generated in ${(generatedInMs / 1000).toFixed(1)}s`
                : "phenotype template (no API key)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`mailto:?subject=Your visit summary&body=Hi, attached is your visit summary.`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Email
            </a>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
        <article className="rounded-xl border border-slate-200 bg-white p-10 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <header className="flex items-center justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="text-xl font-semibold tracking-tight">Polaris</div>
              <div className="mt-0.5 text-xs text-slate-500">
                UW Health Women's Clinic · Dr. Sarah Chen
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              For: new patient
              <br />
              Intake ID: {intake.id.slice(0, 8)}
            </div>
          </header>

          <div className="mt-8">
            <h1 className="text-2xl font-semibold leading-tight">{content.title}</h1>
            <p className="mt-3 text-sm text-slate-700">{content.intro}</p>
          </div>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              What we think is going on
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-800">
              {content.phenotypeExplanation}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Your next steps
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-800">
              {content.nextSteps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Three questions to bring back next visit
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-800">
              {content.questionsToAsk.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-lg bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Lifestyle, matched to your phenotype
            </h2>
            <p className="mt-2 text-sm text-slate-700">{content.lifestyleIntro}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-800">
              {content.lifestyleRecommendations.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span>
                    <span className="font-medium">{r.title}.</span> {r.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">
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

function adaptIntakeToPatient(
  intakeId: string,
  intakeData: Record<string, string | string[]>,
  classification: {
    phenotype: string
    ir_likelihood: number
    confidence: string
    reasoning: string[]
  } | null
): SamplePatient {
  const symptoms = (intakeData["symptoms"] as string[]) ?? []
  const familyHistory = (intakeData["family_history"] as string[]) ?? []
  return {
    id: intakeId,
    firstName: "your patient",
    age: 28,
    appointmentTime: "now",
    intakeCompleted: true,
    primaryConcern: (intakeData["primary_concern"] as string) ?? "Not specified",
    cycleLength: (intakeData["cycle_length"] as string) ?? "Not specified",
    cycleRegularity: "irregular",
    symptoms,
    bmi: 25,
    familyHistory,
    currentMedications: [],
    existingLabs: [],
    phenotype: (classification?.phenotype ?? "A") as Phenotype,
    irLikelihood: classification?.ir_likelihood ?? 50,
    confidence: (classification?.confidence ?? "moderate") as "high" | "moderate" | "low",
    reasoning: classification?.reasoning ?? [],
    recommendedWorkup: [],
  }
}
