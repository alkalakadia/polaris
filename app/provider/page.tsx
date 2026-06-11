import Link from "next/link"
import { PolarisLogo } from "@/components/logo"
import { SAMPLE_PATIENTS, PHENOTYPE_LABELS, type Phenotype } from "@/lib/sample-data"
import { getRecentIntakes, type RealIntakeRow } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function ProviderDashboard() {
  const realIntakes = await getRecentIntakes(20)

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-10 border-b border-border-soft bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <PolarisLogo size={28} withWordmark wordmarkClassName="text-base" />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <div className="font-medium">Dr. Sarah Chen</div>
              <div className="text-xs text-ink-3">UW Health Women's Clinic</div>
            </div>
            <div className="bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white shadow-soft">
              SC
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {/* Title row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-coral-deep">
              Today
            </p>
            <h1 className="font-display mt-2 text-4xl font-medium tracking-tight">
              PCOS suspects on your schedule
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
              Patients who have completed pre-visit intake. Click any to see her phenotype,
              recommended workup, and a personalized handout ready to print.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-border-strong bg-card px-4 py-2 text-xs font-medium text-ink-2 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            {realIntakes.length + SAMPLE_PATIENTS.length} patients
          </div>
        </div>

        {/* Real intakes */}
        {realIntakes.length > 0 && (
          <div className="mt-12">
            <SectionHeader
              icon={<LiveDot />}
              title="Real intakes"
              subtitle="Live from database"
              accent="coral"
            />
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {realIntakes.map((r) => (
                <RealIntakeCard key={r.id} row={r} />
              ))}
            </div>
          </div>
        )}

        {/* Sample patients */}
        <div className="mt-14">
          <SectionHeader
            icon={
              <span className="rounded-full bg-plum-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-plum">
                Demo
              </span>
            }
            title="Sample patients"
            subtitle="Hardcoded for demo · spans Rotterdam Types A, B, C, D"
            accent="plum"
          />
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_PATIENTS.map((p) => (
              <SamplePatientCard key={p.id} patient={p} />
            ))}
          </div>
        </div>

        <p className="mt-16 text-xs leading-relaxed text-ink-3">
          Polaris is a clinical decision support prototype. It does not diagnose or treat.
          Always apply clinical judgment.
        </p>
      </section>
    </main>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
  accent: _accent,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  accent: "coral" | "plum"
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-display text-xl font-medium tracking-tight">{title}</h2>
      </div>
      <span className="text-xs text-ink-3">·</span>
      <p className="text-xs text-ink-3">{subtitle}</p>
    </div>
  )
}

function LiveDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-40" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-coral" />
    </span>
  )
}

function SamplePatientCard({
  patient,
}: {
  patient: (typeof SAMPLE_PATIENTS)[number]
}) {
  const label = PHENOTYPE_LABELS[patient.phenotype]
  return (
    <Link
      href={`/provider/${patient.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border-soft bg-card p-5 shadow-soft transition hover:border-coral/40 hover:shadow-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-peach-soft to-coral-soft text-lg font-semibold text-plum">
            {patient.firstName[0]}
          </div>
          <div>
            <div className="font-display text-lg font-medium tracking-tight">{patient.firstName}</div>
            <div className="text-xs text-ink-3">
              Age {patient.age} · {patient.appointmentTime}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-canvas-tint px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-plum">
          Type {patient.phenotype}
        </span>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-ink-2">{patient.primaryConcern}</p>

      <div className="mt-5 border-t border-border-soft pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
            IR likelihood
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            {patient.irLikelihood}%
          </span>
        </div>
        <IRBar value={patient.irLikelihood} />
        <p className="mt-3 text-[11px] leading-relaxed text-ink-3">{label.name}</p>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-coral-deep transition group-hover:gap-2">
        Open chart
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </div>
    </Link>
  )
}

function RealIntakeCard({ row }: { row: RealIntakeRow }) {
  const firstName = (row.intake_data["first_name"] as string) || "New patient"
  const concern = (row.intake_data["primary_concern"] as string) ?? "Concern not specified"
  const phenotype = (row.classification?.phenotype ?? "Unlikely") as Phenotype
  const ir = row.classification?.ir_likelihood ?? 0
  const label = PHENOTYPE_LABELS[phenotype]
  const initial = firstName.charAt(0).toUpperCase()

  return (
    <Link
      href={`/provider/r/${row.id}`}
      className="group relative overflow-hidden rounded-2xl border-2 border-coral/30 bg-card p-5 shadow-soft transition hover:border-coral/60 hover:shadow-pop"
    >
      <div className="absolute -top-px right-4 inline-flex items-center gap-1.5 rounded-b-md bg-coral px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white">
        <LiveDot />
        Live
      </div>

      <div className="flex items-start gap-3">
        <div className="bg-brand-gradient flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white shadow-soft">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-lg font-medium tracking-tight">{firstName}</div>
          <div className="text-xs text-ink-3">{timeAgo(row.created_at)}</div>
        </div>
        <span className="shrink-0 rounded-full bg-canvas-tint px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-plum">
          Type {phenotype}
        </span>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-ink-2">{concern}</p>

      <div className="mt-5 border-t border-border-soft pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
            IR likelihood
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">{ir}%</span>
        </div>
        <IRBar value={ir} />
        <p className="mt-3 text-[11px] leading-relaxed text-ink-3">{label.name}</p>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-coral-deep transition group-hover:gap-2">
        Open chart
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </div>
    </Link>
  )
}

function IRBar({ value }: { value: number }) {
  const gradient =
    value >= 60
      ? "from-coral to-coral-deep"
      : value >= 35
      ? "from-peach to-coral"
      : "from-sage to-sage"
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}
