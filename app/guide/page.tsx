"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PatientShell } from "@/components/patient-shell"
import { MedicalIcon } from "@/components/medical-icon"
import { GUIDELINE_FACTS, MYTHS } from "@/lib/guide"

export default function GuidePage() {
  const router = useRouter()
  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="grid h-9 w-9 place-items-center rounded-full bg-white text-g-ink-2 shadow-girly active:scale-90" aria-label="Go back">
          <ArrowLeft size={17} />
        </button>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-g-sky-soft text-g-sky">
          <MedicalIcon name="bookOpen" size={22} className="text-current" />
        </span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">The basics</h1>
          <p className="text-sm font-semibold text-g-ink-3">Evidence-based, no fads, no shame</p>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-candy-soft px-4 py-2.5 text-sm font-bold text-g-ink">
        This follows the 2023 international PMOS (formerly PCOS) guidelines, the same evidence doctors use. It&apos;s general
        information, not personal medical advice.
      </p>

      {/* Myth vs Fact */}
      <div className="mt-5 flex items-center gap-2 px-1 text-base font-bold text-g-ink">
        <MedicalIcon name="messageCircle" size={18} className="text-g-ink-3" />
        <h2 className="font-cute text-base font-bold text-g-ink">Myth vs fact</h2>
      </div>
      <div className="mt-2 space-y-3">
        {MYTHS.map((m, i) => (
          <div key={i} className="overflow-hidden rounded-3xl border border-g-border bg-white shadow-girly">
            <div className="bg-g-pink-soft px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-g-pink-deep">Myth</p>
              <p className="mt-0.5 text-sm font-bold text-g-ink">&ldquo;{m.myth}&rdquo;</p>
            </div>
            <div className="px-4 py-3">
              <div className="inline-flex items-center gap-2">
                <MedicalIcon name="check" size={14} className="text-g-ink-3" />
                <p className="text-xs font-bold uppercase tracking-wide text-g-ink-3">Fact</p>
              </div>
              <p className="mt-0.5 text-sm font-medium text-g-ink-2">{m.fact}</p>
            </div>
          </div>
        ))}
      </div>

      {/* What the guidelines say */}
      <div className="mt-6 flex items-center gap-2 px-1 text-base font-bold text-g-ink">
        <MedicalIcon name="clipboardList" size={18} className="text-g-ink-3" />
        <h2 className="font-cute text-base font-bold text-g-ink">What the guidelines actually say</h2>
      </div>
      <div className="mt-2 space-y-2.5">
        {GUIDELINE_FACTS.map((f) => (
          <div key={f.title} className="flex items-start gap-3 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-candy-soft text-g-ink">
              <MedicalIcon name={f.icon} size={20} className="text-current" />
            </span>
            <div className="min-w-0">
              <p className="font-cute text-sm font-bold text-g-ink">{f.title}</p>
              <p className="mt-0.5 text-sm font-medium text-g-ink-2">{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-g-butter-soft px-4 py-3 text-xs font-semibold text-g-ink">
        <span className="inline-flex items-center gap-1 font-bold text-g-ink-3">
          <MedicalIcon name="shield" size={14} className="text-g-ink-3" />
          Be wary of anyone selling a “PMOS cure,” magic supplement, or one-size diet, especially if
        </span>
        <span> they&apos;re also selling the product. When in doubt, bring it to your doctor.</span>
      </div>

      <p className="mt-4 px-2 text-center text-xs font-semibold text-g-ink-3">
        MyPMOS is a companion, not a doctor, and never diagnoses. For anything specific to you, please see a
        provider.
      </p>
    </PatientShell>
  )
}
