import Link from "next/link"
import { notFound } from "next/navigation"
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/provider" className="text-sm text-slate-500 hover:text-slate-900">
              ← Schedule
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-teal-400" />
              <span className="text-sm font-semibold tracking-tight">Polaris</span>
            </div>
          </div>
          <Link
            href={`/provider/${patient.id}/handout`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Generate patient handout
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {/* Patient header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-teal-100 text-lg font-semibold text-slate-700">
              {patient.firstName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {patient.firstName}, {patient.age}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {patient.appointmentTime} · Intake complete · BMI {patient.bmi}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Primary concern
            </div>
            <div className="mt-1 max-w-md text-slate-900">{patient.primaryConcern}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Phenotype card */}
          <PhenotypeCard patient={patient} />

          {/* Intake summary */}
          <IntakeSummary patient={patient} />

          {/* Reasoning */}
          <ReasoningCard patient={patient} />
        </div>

        {/* Workup */}
        <WorkupCard patient={patient} />

        <p className="mt-10 text-xs text-slate-400">
          Demo data. Polaris is a clinical decision support prototype. It does not diagnose or treat.
          Provider judgment required. Phenotype classification based on Rotterdam 2003/2018 criteria.
        </p>
      </section>
    </main>
  )
}

function PhenotypeCard({ patient }: { patient: SamplePatient }) {
  const label = PHENOTYPE_LABELS[patient.phenotype]
  const irColor =
    patient.irLikelihood >= 60
      ? "from-rose-500 to-rose-600"
      : patient.irLikelihood >= 35
      ? "from-amber-500 to-amber-600"
      : "from-emerald-500 to-emerald-600"

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        Phenotype classification
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight">Type {patient.phenotype}</span>
        <span className="text-xs font-medium text-emerald-600">
          {patient.confidence === "high"
            ? "high confidence"
            : patient.confidence === "moderate"
            ? "moderate confidence"
            : "low confidence"}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900">{label.name}</p>
      <p className="mt-1 text-xs text-slate-500">{label.criteria}</p>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Insulin resistance likelihood
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-3xl font-semibold tracking-tight">{patient.irLikelihood}%</span>
          <span className="text-xs text-slate-500">vs population baseline</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full bg-gradient-to-r ${irColor}`}
            style={{ width: `${patient.irLikelihood}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function IntakeSummary({ patient }: { patient: SamplePatient }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Intake summary</div>
      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-slate-500">Cycle length</dt>
          <dd className="mt-0.5 text-slate-900">{patient.cycleLength}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Symptoms reported ({patient.symptoms.length})</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {patient.symptoms.map((s) => (
              <span
                key={s}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
              >
                {s}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Family history</dt>
          <dd className="mt-0.5 text-slate-900">
            {patient.familyHistory.join(", ") || "None reported"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Current medications</dt>
          <dd className="mt-0.5 text-slate-900">
            {patient.currentMedications.join(", ") || "None"}
          </dd>
        </div>
        {patient.existingLabs.length > 0 && (
          <div>
            <dt className="text-xs font-medium text-slate-500">Existing labs (already done)</dt>
            <dd className="mt-1 space-y-1">
              {patient.existingLabs.map((l) => (
                <div key={l.name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{l.name}</span>
                  <span className="font-medium text-slate-900">{l.value}</span>
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
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Reasoning</div>
      <p className="mt-2 text-xs text-slate-500">How we got to this phenotype assignment.</p>
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {patient.reasoning.map((r, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-semibold text-indigo-700">
              {i + 1}
            </span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
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
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recommended workup</h2>
          <p className="mt-1 text-sm text-slate-500">
            Prioritized to confirm the phenotype assignment and quantify metabolic risk.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Send to Epic (demo)
        </button>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Essential</div>
        <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {essential.map((w) => (
            <li key={w.test} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-slate-900">{w.test}</div>
                <div className="mt-0.5 text-xs text-slate-500">{w.reason}</div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      </div>

      {supportive.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Supportive
          </div>
          <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {supportive.map((w) => (
              <li key={w.test} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium text-slate-900">{w.test}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{w.reason}</div>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
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
