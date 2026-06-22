import Link from "next/link"
import { notFound } from "next/navigation"
import { PolarisLogo } from "@/components/logo"
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

  const firstName = (intake.intake_data["first_name"] as string) || "New patient"
  const concern = (intake.intake_data["primary_concern"] as string) ?? "Not specified"
  const cycleLength = (intake.intake_data["cycle_length"] as string) ?? "Not specified"
  const symptoms = (intake.intake_data["symptoms"] as string[]) ?? []
  const familyHistory = (intake.intake_data["family_history"] as string[]) ?? []
  const goals = (intake.intake_data["goals"] as string) ?? "Not specified"
  const labPhotos = (intake.intake_data["lab_photos"] as string[]) ?? []

  const c = intake.classification
  const phenotype = (c?.phenotype ?? "Unlikely") as Phenotype
  const phLabel = PHENOTYPE_LABELS[phenotype]
  const ir = c?.ir_likelihood ?? 0
  const gradient =
    ir >= 60 ? "from-coral to-coral-deep" : ir >= 35 ? "from-peach to-coral" : "from-sage to-sage"

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-10 border-b border-border-soft bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/provider" className="shrink-0 text-sm font-medium text-ink-3 transition hover:text-ink">
              ← Schedule
            </Link>
            <div className="hidden h-5 w-px bg-border-soft sm:block" />
            <Link href="/" className="hidden sm:block">
              <PolarisLogo size={26} withWordmark wordmarkClassName="text-base" />
            </Link>
          </div>
          <Link
            href={`/provider/r/${intake.id}/handout`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-canvas shadow-pop transition hover:bg-plum"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v6m0 0 3-3M8 8 5 5m-3 8h12" />
            </svg>
            <span className="sm:hidden">Handout</span>
            <span className="hidden sm:inline">Generate patient handout</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {/* Patient header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-brand-gradient flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-pop">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-3xl font-medium tracking-tight">{firstName}</h1>
              <p className="mt-1 font-mono text-[11px] text-ink-3">
                {intake.id.slice(0, 8)} · submitted {timeAgo(intake.created_at)}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border-soft bg-card px-5 py-3 shadow-soft sm:max-w-md">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
              Primary concern
            </div>
            <div className="mt-1 text-sm text-ink">{concern}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {/* Phenotype card */}
          <div className="rounded-2xl border border-border-soft bg-card p-6 shadow-soft">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
              Phenotype classification
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-medium tracking-tight">Type {phenotype}</span>
              {c && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    c.confidence === "high"
                      ? "bg-sage/15 text-sage"
                      : c.confidence === "moderate"
                      ? "bg-peach-soft text-coral-deep"
                      : "bg-canvas-tint text-ink-3"
                  }`}
                >
                  {c.confidence} confidence
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-ink">{phLabel.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">{phLabel.criteria}</p>

            <div className="mt-6 border-t border-border-soft pt-5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                Insulin resistance likelihood
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="font-display text-4xl font-medium tracking-tight">{ir}%</span>
                <span className="text-xs text-ink-3">vs population baseline</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border-soft">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                  style={{ width: `${ir}%` }}
                />
              </div>
            </div>
          </div>

          {/* Intake summary */}
          <div className="rounded-2xl border border-border-soft bg-card p-6 shadow-soft">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
              Intake summary
            </div>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-ink-3">Cycle length</dt>
                <dd className="mt-1 text-ink">{cycleLength}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-3">
                  Symptoms reported ({symptoms.length})
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {symptoms.length === 0 && (
                    <span className="text-xs text-ink-3">None reported</span>
                  )}
                  {symptoms.map((s) => (
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
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {familyHistory.length === 0 && (
                    <span className="text-xs text-ink-3">None reported</span>
                  )}
                  {familyHistory.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-canvas-tint px-2.5 py-1 text-[11px] font-medium text-plum"
                    >
                      {f}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-3">Patient goal</dt>
                <dd className="mt-1 text-ink">{goals}</dd>
              </div>
            </dl>
          </div>

          {/* Reasoning */}
          <div className="rounded-2xl border border-border-soft bg-card p-6 shadow-soft">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
              Reasoning
            </div>
            <p className="mt-2 text-xs text-ink-3">How we got to this phenotype assignment.</p>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-ink">
              {(c?.reasoning ?? []).map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="bg-brand-gradient mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span>{r}</span>
                </li>
              ))}
              {!c && (
                <li className="text-xs text-ink-3">
                  Classification not yet available. Refresh in a moment.
                </li>
              )}
            </ul>
            <p className="mt-5 border-t border-border-soft pt-4 text-xs leading-relaxed text-ink-3">
              Sources: Rotterdam 2003/2018 criteria, Endocrine Society Clinical Practice Guidelines
              2023, AE-PCOS Society 2009.
            </p>
          </div>
        </div>

        {labPhotos.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border-soft bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-medium tracking-tight">
                  Patient-uploaded lab photos
                </h2>
                <p className="mt-1 text-xs text-ink-3">
                  Captured during intake on her phone. V2 will OCR + structure these automatically.
                </p>
              </div>
              <span className="rounded-full bg-coral-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-coral-deep">
                {labPhotos.length} photo{labPhotos.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {labPhotos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border-strong bg-canvas-tint"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Lab result ${i + 1}`}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-ink/0 transition group-hover:bg-ink/20" />
                  <div className="absolute bottom-2 left-2 rounded-md bg-card/95 px-2 py-0.5 text-[10px] font-semibold text-ink shadow-soft">
                    Open
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 text-xs leading-relaxed text-ink-3">
          Polaris is a clinical decision support prototype. It does not diagnose or treat.
          Provider judgment required.
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
