import Link from "next/link"
import { SAMPLE_PATIENTS, PHENOTYPE_LABELS, type Phenotype } from "@/lib/sample-data"
import { getRecentIntakes, type RealIntakeRow } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function ProviderDashboard() {
  const realIntakes = await getRecentIntakes(20)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-teal-400" />
            <span className="text-base font-semibold tracking-tight">Polaris</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <div className="font-medium">Dr. Sarah Chen</div>
              <div className="text-xs text-slate-500">UW Health Women's Clinic</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              SC
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Today</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              PCOS suspects on your schedule
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Patients who have completed pre-visit intake. Click any to see her phenotype,
              recommended workup, and a personalized handout ready to print.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {realIntakes.length + SAMPLE_PATIENTS.length} patients
          </div>
        </div>

        {realIntakes.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                Real intakes
              </h2>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                live · from database
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-emerald-50 text-left text-xs font-medium uppercase tracking-wider text-emerald-800">
                  <tr>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Submitted</th>
                    <th className="px-6 py-3">Primary concern</th>
                    <th className="px-6 py-3">Phenotype</th>
                    <th className="px-6 py-3">IR likelihood</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realIntakes.map((r) => (
                    <RealIntakeRowView key={r.id} row={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              Sample patients (demo)
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              hardcoded
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Primary concern</th>
                  <th className="px-6 py-3">Phenotype</th>
                  <th className="px-6 py-3">IR likelihood</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SAMPLE_PATIENTS.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-teal-100 text-xs font-semibold text-slate-700">
                          {p.firstName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{p.firstName}</div>
                          <div className="text-xs text-slate-500">Age {p.age}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{p.appointmentTime}</td>
                    <td className="px-6 py-4 text-slate-700">{p.primaryConcern}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                        Type {p.phenotype}
                      </span>
                      <div className="mt-1 text-xs text-slate-500">
                        {PHENOTYPE_LABELS[p.phenotype].name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <IRBar value={p.irLikelihood} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/provider/${p.id}`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Open chart
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Polaris is a clinical decision support prototype. It does not diagnose or treat. Always
          apply clinical judgment.
        </p>
      </section>
    </main>
  )
}

function RealIntakeRowView({ row }: { row: RealIntakeRow }) {
  const concern =
    (row.intake_data["primary_concern"] as string) || "Concern not specified"
  const phenotype = (row.classification?.phenotype ?? "Unlikely") as Phenotype
  const ir = row.classification?.ir_likelihood ?? 0
  const idShort = row.id.slice(0, 8)

  return (
    <tr className="transition hover:bg-emerald-50/40">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-xs font-semibold text-emerald-800">
            ?
          </div>
          <div>
            <div className="font-medium text-slate-900">New patient</div>
            <div className="font-mono text-xs text-slate-500">{idShort}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-700">{timeAgo(row.created_at)}</td>
      <td className="px-6 py-4 text-slate-700">{concern}</td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
          Type {phenotype}
        </span>
        <div className="mt-1 text-xs text-slate-500">{PHENOTYPE_LABELS[phenotype].name}</div>
      </td>
      <td className="px-6 py-4">
        <IRBar value={ir} />
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/provider/r/${row.id}`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          Open chart
        </Link>
      </td>
    </tr>
  )
}

function IRBar({ value }: { value: number }) {
  const color = value >= 60 ? "bg-rose-500" : value >= 35 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-700">{value}%</span>
    </div>
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
