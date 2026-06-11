import Link from "next/link"
import { notFound } from "next/navigation"
import { PolarisLogo } from "@/components/logo"
import { getPatientById, PHENOTYPE_LABELS, type SamplePatient } from "@/lib/sample-data"

export default async function PatientChart({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const patient = getPatientById(patientId)
  if (!patient) notFound()

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-10 border-b border-border-soft bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/provider" className="text-sm font-medium text-ink-3 transition hover:text-ink">
              ← Schedule
            </Link>
            <div className="h-5 w-px bg-border-soft" />
            <Link href="/">
              <PolarisLogo size={26} withWordmark wordmarkClassName="text-base" />
            </Link>
          </div>
          <Link
            href={`/provider/${patient.id}/handout`}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-canvas shadow-pop transition hover:bg-plum"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v6m0 0 3-3M8 8 5 5m-3 8h12" />
            </svg>
            Generate patient handout
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <PatientHeader patient={patient} />

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <PhenotypeCard patient={patient} />
          <IntakeSummary patient={patient} />
          <ReasoningCard patient={patient} />
        </div>

        <WorkupCard patient={patient} />

        <p className="mt-10 text-xs leading-relaxed text-ink-3">
          Polaris is a clinical decision support prototype. It does not diagnose or treat.
          Provider judgment required. Phenotype classification based on Rotterdam 2003/2018 criteria.
        </p>
      </section>
    </main>
  )
}

function PatientHeader({ patient }: { patient: SamplePatient }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-peach-soft to-coral-soft text-2xl font-semibold text-plum">
          {patient.firstName[0]}
        </div>
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">
            {patient.firstName}, {patient.age}
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {patient.appointmentTime} · Intake complete · BMI {patient.bmi}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border-soft bg-card px-5 py-3 shadow-soft sm:max-w-md">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
          Primary concern
        </div>
        <div className="mt-1 text-sm text-ink">{patient.primaryConcern}</div>
      </div>
    </div>
  )
}

function PhenotypeCard({ patient }: { patient: SamplePatient }) {
  const label = PHENOTYPE_LABELS[patient.phenotype]
  const gradient =
    patient.irLikelihood >= 60
      ? "from-coral to-coral-deep"
      : patient.irLikelihood >= 35
      ? "from-peach to-coral"
      : "from-sage to-sage"

  return (
    <div className="rounded-2xl border border-border-soft bg-card p-6 shadow-soft">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
        Phenotype classification
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-4xl font-medium tracking-tight">Type {patient.phenotype}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            patient.confidence === "high"
              ? "bg-sage/15 text-sage"
              : patient.confidence === "moderate"
              ? "bg-peach-soft text-coral-deep"
              : "bg-canvas-tint text-ink-3"
          }`}
        >
          {patient.confidence} confidence
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-ink">{label.name}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-3">{label.criteria}</p>

      <div className="mt-6 border-t border-border-soft pt-5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
          Insulin resistance likelihood
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="font-display text-4xl font-medium tracking-tight">{patient.irLikelihood}%</span>
          <span className="text-xs text-ink-3">vs population baseline</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border-soft">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
            style={{ width: `${patient.irLikelihood}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function IntakeSummary({ patient }: { patient: SamplePatient }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-card p-6 shadow-soft">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
        Intake summary
      </div>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-xs font-medium text-ink-3">Cycle length</dt>
          <dd className="mt-1 text-ink">{patient.cycleLength}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-ink-3">
            Symptoms reported ({patient.symptoms.length})
          </dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {patient.symptoms.map((s) => (
              <span
                key={s}
                className="rounded-full bg-canvas-tint px-2.5 py-1 text-[11px] font-medium text-plum"
              >
                {s}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-ink-3">Family history</dt>
          <dd className="mt-1 text-ink">{patient.familyHistory.join(", ") || "None reported"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-ink-3">Current medications</dt>
          <dd className="mt-1 text-ink">{patient.currentMedications.join(", ") || "None"}</dd>
        </div>
        {patient.existingLabs.length > 0 && (
          <div>
            <dt className="text-xs font-medium text-ink-3">Existing labs (already done)</dt>
            <dd className="mt-1.5 space-y-1.5">
              {patient.existingLabs.map((l) => (
                <div key={l.name} className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">{l.name}</span>
                  <span className="font-medium text-ink">{l.value}</span>
                </div>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

function ReasoningCard({ patient }: { patient: SamplePatient }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-card p-6 shadow-soft">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
        Reasoning
      </div>
      <p className="mt-2 text-xs text-ink-3">How we got to this phenotype assignment.</p>
      <ul className="mt-5 space-y-4 text-sm leading-relaxed text-ink">
        {patient.reasoning.map((r, i) => (
          <li key={i} className="flex gap-3">
            <span className="bg-brand-gradient mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white">
              {i + 1}
            </span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-border-soft pt-4 text-xs leading-relaxed text-ink-3">
        Sources: Rotterdam 2003/2018 criteria, Endocrine Society Clinical Practice Guidelines 2023,
        AE-PCOS Society 2009.
      </p>
    </div>
  )
}

function WorkupCard({ patient }: { patient: SamplePatient }) {
  const essential = patient.recommendedWorkup.filter((w) => w.priority === "essential")
  const supportive = patient.recommendedWorkup.filter((w) => w.priority === "supportive")

  return (
    <div className="mt-5 rounded-2xl border border-border-soft bg-card p-7 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight">Recommended workup</h2>
          <p className="mt-1 text-sm text-ink-2">
            Prioritized to confirm the phenotype assignment and quantify metabolic risk.
          </p>
        </div>
        <button
          type="button"
          className="self-start rounded-full border border-border-strong bg-canvas-tint px-4 py-2 text-xs font-medium text-ink-2 shadow-soft transition hover:bg-card"
        >
          Send to Epic (demo)
        </button>
      </div>

      <div className="mt-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
          Essential
        </div>
        <ul className="mt-3 divide-y divide-border-soft rounded-2xl border border-border-soft bg-canvas/40">
          {essential.map((w) => (
            <li key={w.test} className="flex items-start justify-between gap-4 px-5 py-4 text-sm">
              <div>
                <div className="font-medium text-ink">{w.test}</div>
                <div className="mt-0.5 text-xs text-ink-2">{w.reason}</div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border border-border-strong bg-card px-3 py-1 text-xs font-medium text-ink-2 transition hover:bg-canvas-tint"
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      </div>

      {supportive.length > 0 && (
        <div className="mt-7">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
            Supportive
          </div>
          <ul className="mt-3 divide-y divide-border-soft rounded-2xl border border-border-soft bg-canvas/40">
            {supportive.map((w) => (
              <li key={w.test} className="flex items-start justify-between gap-4 px-5 py-4 text-sm">
                <div>
                  <div className="font-medium text-ink">{w.test}</div>
                  <div className="mt-0.5 text-xs text-ink-2">{w.reason}</div>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-border-strong bg-card px-3 py-1 text-xs font-medium text-ink-2 transition hover:bg-canvas-tint"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
