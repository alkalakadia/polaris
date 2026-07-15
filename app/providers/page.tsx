"use client"

import { useState } from "react"
import { Search, Video, Stethoscope, HeartPulse, ExternalLink } from "lucide-react"
import { PatientShell } from "@/components/patient-shell"

interface Resource {
  name: string
  what: string
  url: string
  Icon: React.ElementType
  tag: string
}

/** Real, credible ways to find PMOS-aware care. No fake listings. */
const TELEHEALTH: Resource[] = [
  { name: "Allara Health", what: "Virtual PMOS care — MDs + dietitians, takes insurance, most US states.", url: "https://www.allarahealth.com", Icon: Video, tag: "Telehealth" },
  { name: "Pollie", what: "Whole-person PCOS/PMOS coaching and care team, virtual.", url: "https://www.pollie.co", Icon: HeartPulse, tag: "Telehealth" },
]

const DIRECTORIES: Resource[] = [
  { name: "Zocdoc", what: "Search in-person OB/GYNs and endocrinologists near you, filter by insurance, book online.", url: "https://www.zocdoc.com/search", Icon: Stethoscope, tag: "Find in person" },
  { name: "Planned Parenthood", what: "Find a nearby health center for reproductive and hormonal care.", url: "https://www.plannedparenthood.org/health-center", Icon: HeartPulse, tag: "Clinics" },
]

export default function ProvidersPage() {
  const [where, setWhere] = useState("")

  function search() {
    const q = encodeURIComponent(`PCOS PMOS specialist ${where ? `near ${where}` : "near me"} OB/GYN endocrinologist`)
    window.open(`https://www.google.com/search?q=${q}`, "_blank", "noopener,noreferrer")
  }

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-g-pink-soft">
          <Stethoscope size={18} className="text-g-pink-deep" />
        </span>
        <div>
          <h1 className="font-cute text-2xl text-g-ink">Find a provider</h1>
          <p className="text-sm font-medium text-g-ink-3">PMOS-aware OB/GYNs, endocrinologists & telehealth</p>
        </div>
      </div>

      {/* Location search → opens a real provider search */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-g-border bg-white px-3 py-2.5 shadow-girly">
        <Search size={16} className="shrink-0 text-g-ink-3" />
        <input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Your city or ZIP"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-g-ink outline-none placeholder:text-g-ink-3"
        />
        <button onClick={search} className="shrink-0 rounded-full bg-g-pink px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95">
          Search
        </button>
      </div>

      <Section title="Virtual PMOS care">
        {TELEHEALTH.map((r) => (
          <ResourceCard key={r.name} r={r} />
        ))}
      </Section>

      <Section title="Find someone in person">
        {DIRECTORIES.map((r) => (
          <ResourceCard key={r.name} r={r} />
        ))}
      </Section>

      <div className="mt-5 rounded-2xl bg-g-lavender-soft px-4 py-3.5">
        <p className="text-sm font-semibold text-g-ink">💡 Tip</p>
        <p className="mt-1 text-sm font-medium text-g-ink-2">
          Not sure where to start? Ask your <b>primary care</b> doctor for a referral to gynecology or endocrinology,
          and bring your MyPMOS <b>visit summary</b> so they can act fast.
        </p>
      </div>

      <p className="mt-5 px-2 text-center text-xs font-semibold text-g-ink-3">
        These are starting points, not endorsements. Always check that a provider is right for you and in your network.
      </p>
    </PatientShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="px-1 font-cute text-base text-g-ink">{title}</h2>
      <div className="mt-2 space-y-2.5">{children}</div>
    </section>
  )
}

function ResourceCard({ r }: { r: Resource }) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-2xl border border-g-border bg-white p-4 shadow-girly transition active:scale-[0.99]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-g-pink-soft">
        <r.Icon size={18} className="text-g-pink-deep" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-g-ink">{r.name}</p>
          <span className="rounded-full bg-g-canvas-2 px-2 py-0.5 text-[0.65rem] font-bold text-g-ink-3">{r.tag}</span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-g-ink-2">{r.what}</p>
      </div>
      <ExternalLink size={15} className="mt-1 shrink-0 text-g-ink-3" />
    </a>
  )
}
