"use client"

import Link from "next/link"
import { useState } from "react"
import { PatientShell } from "@/components/patient-shell"
import { cn } from "@/lib/cn"
import {
  CONTRACEPTION,
  DIAGNOSIS_OPTIONS,
  FAMILY_HISTORY,
  PREGNANCY_INTENT,
  getProfile,
  saveProfile,
  type CycleProfile,
  type LabResult,
} from "@/lib/profile"

export default function HealthPage() {
  const [p, setP] = useState<CycleProfile>(() => getProfile())
  const [saved, setSaved] = useState(false)
  const set = (patch: Partial<CycleProfile>) => {
    setP((prev) => ({ ...prev, ...patch }))
    setSaved(false)
  }
  const units = p.units ?? "us"

  // Height: edit in ft/in for US, cm for metric.
  const ft = p.heightCm ? Math.floor(p.heightCm / 30.48) : ""
  const inch = p.heightCm ? Math.round((p.heightCm / 2.54) % 12) : ""
  function setHeightImperial(f: number, i: number) {
    set({ heightCm: Math.round((f * 12 + i) * 2.54) })
  }

  function save() {
    saveProfile({ ...p, completedAt: p.completedAt ?? Date.now() })
    setSaved(true)
  }

  // Labs
  const labs = p.labs ?? []
  const addLab = () => set({ labs: [...labs, { name: "", value: "" }] })
  const setLab = (i: number, patch: Partial<LabResult>) =>
    set({ labs: labs.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) })
  const removeLab = (i: number) => set({ labs: labs.filter((_, idx) => idx !== i) })

  return (
    <PatientShell>
      <div className="flex items-center gap-2">
        <span className="animate-float text-3xl">🩺</span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">My health</h1>
          <p className="text-sm font-semibold text-g-ink-3">The details your gyno will want 💗</p>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-g-lavender-soft px-4 py-2.5 text-xs font-bold text-g-ink">
        This stays private to you. It's used for your Gyno PDF and to personalize your insights. Never a diagnosis.
      </p>

      <Link
        href="/symptoms"
        className="mt-3 flex items-center justify-between rounded-3xl bg-candy px-4 py-3.5 shadow-girly-pop active:scale-[0.99]"
      >
        <span>
          <span className="block font-cute text-base font-bold text-white">My symptom profile 📝</span>
          <span className="text-xs font-semibold text-white/90">Tap anything you experience — covers the full picture</span>
        </span>
        <span className="text-xl text-white">›</span>
      </Link>

      {/* Units */}
      <Section title="Units" emoji="📐">
        <div className="flex rounded-full bg-g-canvas p-1">
          {(["us", "metric"] as const).map((u) => (
            <button
              key={u}
              onClick={() => set({ units: u })}
              className={cn(
                "flex-1 rounded-full py-2 text-sm font-bold transition",
                units === u ? "bg-candy text-white shadow-girly" : "text-g-ink-2"
              )}
            >
              {u === "us" ? "lb / ft" : "kg / cm"}
            </button>
          ))}
        </div>
      </Section>

      {/* Body */}
      <Section title="Height" emoji="📏">
        {units === "us" ? (
          <div className="flex items-center gap-2">
            <NumInput placeholder="5" suffix="ft" value={ft} onChange={(v) => setHeightImperial(Number(v || 0), Number(inch || 0))} />
            <NumInput placeholder="6" suffix="in" value={inch} onChange={(v) => setHeightImperial(Number(ft || 0), Number(v || 0))} />
          </div>
        ) : (
          <NumInput placeholder="168" suffix="cm" value={p.heightCm ?? ""} onChange={(v) => set({ heightCm: v === "" ? undefined : Number(v) })} />
        )}
        <p className="mt-1.5 text-xs font-semibold text-g-ink-3">Log your weight in the tracker for BMI trends.</p>
      </Section>

      {/* Menstrual history */}
      <Section title="Menstrual history" emoji="🌙">
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="First period (age)">
            <NumInput placeholder="13" value={p.menarcheAge ?? ""} onChange={(v) => set({ menarcheAge: v === "" ? undefined : Number(v) })} />
          </Labeled>
          <Labeled label="Longest gap (days)">
            <NumInput placeholder="60" value={p.longestGapDays ?? ""} onChange={(v) => set({ longestGapDays: v === "" ? undefined : Number(v) })} />
          </Labeled>
        </div>
      </Section>

      {/* Diagnosis */}
      <Section title="PCOS status" emoji="🌸">
        <SingleChips options={DIAGNOSIS_OPTIONS} value={p.diagnosis} onPick={(id) => set({ diagnosis: id as CycleProfile["diagnosis"] })} />
      </Section>

      {/* Family history */}
      <Section title="Family history" emoji="👪">
        <MultiChips options={FAMILY_HISTORY} value={p.familyHistory ?? []} onToggle={(id) => set({ familyHistory: toggle(p.familyHistory ?? [], id) })} />
      </Section>

      {/* Contraception */}
      <Section title="Contraception" emoji="🗓️">
        <SingleChips options={CONTRACEPTION} value={p.contraception} onPick={(id) => set({ contraception: id })} />
      </Section>

      {/* Pregnancy intent */}
      <Section title="Pregnancy plans" emoji="🤍">
        <SingleChips options={PREGNANCY_INTENT} value={p.pregnancyIntent} onPick={(id) => set({ pregnancyIntent: id })} />
      </Section>

      {/* Labs */}
      <Section title="Lab results" emoji="🧪">
        <p className="mb-2 text-xs font-semibold text-g-ink-3">Add any results you have (e.g. testosterone, fasting glucose).</p>
        <div className="space-y-2">
          {labs.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={l.name}
                onChange={(e) => setLab(i, { name: e.target.value })}
                placeholder="Test"
                className="flex-1 rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 text-sm font-semibold text-g-ink outline-none focus:border-g-pink"
              />
              <input
                value={l.value}
                onChange={(e) => setLab(i, { value: e.target.value })}
                placeholder="Value"
                className="w-24 rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 text-sm font-semibold text-g-ink outline-none focus:border-g-pink"
              />
              <button onClick={() => removeLab(i)} className="text-g-ink-3 active:scale-90" aria-label="Remove">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addLab} className="mt-2 rounded-full bg-candy-soft px-4 py-2 text-sm font-bold text-g-ink active:scale-95">
          + Add a lab result
        </button>
      </Section>

      {/* Save */}
      <button
        onClick={save}
        className="mt-5 w-full rounded-full bg-candy py-4 font-cute text-lg font-bold text-white shadow-girly-pop active:scale-[0.98]"
      >
        {saved ? "Saved 💖" : "Save my health profile"}
      </button>
      <div className="h-2" />
    </PatientShell>
  )
}

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
      <h2 className="mb-3 font-cute text-base font-bold text-g-ink">
        {emoji} {title}
      </h2>
      {children}
    </section>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-g-ink-3">{label}</span>
      {children}
    </label>
  )
}

function NumInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: number | string
  onChange: (v: string) => void
  placeholder?: string
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-g-border bg-g-canvas px-3 py-2.5 focus-within:border-g-pink">
      <input
        type="number"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-bold text-g-ink outline-none"
      />
      {suffix && <span className="text-xs font-bold text-g-ink-3">{suffix}</span>}
    </div>
  )
}

function SingleChips({ options, value, onPick }: { options: { id: string; label: string }[]; value?: string; onPick: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onPick(value === o.id ? "" : o.id)}
          className={cn(
            "rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
            value === o.id ? "border-transparent bg-candy text-white shadow-girly" : "border-g-border bg-g-canvas text-g-ink-2"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function MultiChips({ options, value, onToggle }: { options: { id: string; label: string }[]; value: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onToggle(o.id)}
          className={cn(
            "rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
            value.includes(o.id) ? "border-transparent bg-candy text-white shadow-girly" : "border-g-border bg-g-canvas text-g-ink-2"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
