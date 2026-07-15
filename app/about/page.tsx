"use client"

import { Shield, Heart, AlertCircle, Lock } from "lucide-react"
import { PatientShell } from "@/components/patient-shell"
import { GirlyLogo } from "@/components/patient-shell"

const PROMISES = [
  { Icon: Shield, label: "No ads, ever", sub: "We're not a media company. We don't sell attention.", color: "text-g-lavender" },
  { Icon: Lock, label: "Your data stays yours", sub: "We never sell health information. Export or delete anytime.", color: "text-g-pink-deep" },
  { Icon: AlertCircle, label: "We never diagnose", sub: "MyPMOS is a wellness companion. Always consult your care team.", color: "text-g-peach" },
  { Icon: Heart, label: "Built with care", sub: "Made by students who want to make a real difference.", color: "text-g-mint" },
]

export default function AboutPage() {
  return (
    <PatientShell>
      {/* Hero */}
      <div className="flex flex-col items-center rounded-3xl border border-g-border bg-candy-soft px-6 py-8 text-center">
        <GirlyLogo size={64} withWordmark={false} />
        <h1 className="mt-3 font-cute text-3xl text-g-ink">MyPMOS</h1>
        <p className="mt-1 max-w-xs text-sm font-medium leading-relaxed text-g-ink-2">
          Your daily companion for living well with PMOS (formerly PCOS) — built by people who genuinely care.
        </p>
      </div>

      {/* UW badge */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-g-border bg-white p-4 shadow-girly">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: "#c5050c" }}>
          <span className="font-cute text-2xl text-white">W</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-g-ink">University of Wisconsin–Madison</p>
          <p className="mt-0.5 text-xs font-medium text-g-ink-3">Student-built · Independent project · 2026</p>
          <p className="mt-1 text-xs font-semibold text-g-pink-deep">Go Badgers 🦡</p>
        </div>
      </div>

      {/* Mission */}
      <div className="mt-4 rounded-2xl border border-g-border bg-white p-5 shadow-girly">
        <h2 className="font-cute text-lg text-g-ink">Why we built this</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-g-ink-2">
          PMOS affects roughly 1 in 8–10 people with ovaries, yet the average time to diagnosis is still over two
          years. Many leave appointments feeling unheard, carrying symptoms they don&apos;t have language for and data
          they can&apos;t easily share.
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-g-ink-2">
          We built MyPMOS because when you can track, understand, and clearly communicate your symptoms, you walk into
          every appointment with a real advantage. Your data becomes your voice.
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-g-ink-2">
          This app stays far away from diagnosis. We&apos;re a compass, not a doctor, and we&apos;re proud of that
          distinction.
        </p>
      </div>

      {/* Promises */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-g-border bg-white shadow-girly">
        <p className="px-4 pb-2 pt-4 text-[11px] font-bold uppercase tracking-widest text-g-ink-3">Our promises to you</p>
        {PROMISES.map(({ Icon, label, sub, color }) => (
          <div key={label} className="flex items-start gap-3 border-t border-g-border px-4 py-3.5">
            <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} />
            <div>
              <p className="text-sm font-semibold text-g-ink">{label}</p>
              <p className="mt-0.5 text-xs font-medium text-g-ink-2">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 px-2 text-center text-xs font-semibold text-g-ink-3">
        Questions? hello@polaris.app · Read our{" "}
        <a href="/privacy" className="underline">Privacy Policy</a> and{" "}
        <a href="/terms" className="underline">Terms</a>.
      </p>
    </PatientShell>
  )
}
