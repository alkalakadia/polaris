import Link from "next/link"
import { notFound } from "next/navigation"
import { PHENOTYPE_LABELS, type Phenotype } from "@/lib/sample-data"
import { getIntakeById } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function RealIntakeChart({
  params,
}: {
  params: Promise<{ intakeId: string }>
}) {
  const { intakeId } = await params
  const intake = await getIntakeById(intakeId)
  if (!intake) notFound()

  const concern = (intake.intake_data["primary_concern"] as string) ?? "Not specified"
  const cycleLength = (intake.intake_data["cycle_length"] as string) ?? "Not specified"
  const symptoms = (intake.intake_data["symptoms"] as string[]) ?? []
  const familyHistory = (intake.intake_data["family_history"] as string[]) ?? []
  const goals = (intake.intake_data["goals"] as string) ?? "Not specified"

  const c = intake.classification
  const phenotype = (c?.phenotype ?? "Unlikely") as Phenotype
  const phLabel = PHENOTYPE_LABELS[phenotype]
  const ir = c?.ir_likelihood ?? 0
  const irColor =
    ir >= 60
      ? "from-rose-500 to-rose-600"
      : ir >= 35
      ? "from-amber-500 to-amber-600"
      : "from-emerald-500 to-emerald-600"

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
            href={`/provider/r/${intake.id}/handout`}
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-lg font-semibold text-emerald-800">
              ?
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">New patient</h1>
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {intake.id} · submitted {timeAgo(intake.created_at)}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Primary concern
            </div>
            <div className="mt-1 max-w-md text-slate-900">{concern}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Phenotype card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Phenotype classification
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">Type {phenotype}</span>
              {c && (
                <span className="text-xs font-medium text-emerald-600">
                  {c.confidence === "high"
                    ? "high confidence"
                    : c.confidence === "moderate"
                    ? "moderate confidence"
                    : "low confidence"}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-slate-900">{phLabel.name}</p>
            <p className="mt-1 text-xs text-slate-500">{phLabel.criteria}</p>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Insulin resistance likelihood
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-3xl font-semibold tracking-tight">{ir}%</span>
                <span className="text-xs text-slate-500">vs population baseline</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full bg-gradient-to-r ${irColor}`}
                  style={{ width: `${ir}%` }}
                />
              </div>
            </div>
          </div>

          {/* Intake summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Intake summary
            </div>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500">Cycle length</dt>
                <dd className="mt-0.5 text-slate-900">{cycleLength}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  Symptoms reported ({symptoms.length})
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {symptoms.length === 0 && (
                    <span className="text-xs text-slate-500">None reported</span>
                  )}
                  {symptoms.map((s) => (
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
                <dd className="mt-1 flex flex-wrap gap-1">
                  {familyHistory.length === 0 && (
                    <span className="text-xs text-slate-500">None reported</span>
                  )}
                  {familyHistory.map((f) => (
                    <span
                      key={f}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                    >
                      {f}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Patient goal</dt>
                <dd className="mt-0.5 text-slate-900">{goals}</dd>
              </div>
            </dl>
          </div>

          {/* Reasoning */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Reasoning
            </div>
            <p className="mt-2 text-xs text-slate-500">How we got to this phenotype assignment.</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {(c?.reasoning ?? []).map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-semibold text-indigo-700">
                    {i + 1}
                  </span>
                  <span>{r}</span>
                </li>
              ))}
              {!c && (
                <li className="text-xs text-slate-500">
                  Classification not yet available. Refresh in a moment.
                </li>
              )}
            </ul>
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
              Sources: Rotterdam 2003/2018 criteria, Endocrine Society Clinical Practice Guidelines
              2023, AE-PCOS Society 2009.
            </p>
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          Polaris is a clinical decision support prototype. It does not diagnose or treat. Provider
          judgment required.
        </p>
      </section>
    </main>
  )
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}
