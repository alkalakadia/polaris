"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { PatientShell } from "@/components/patient-shell"
import { MedicalIcon } from "@/components/medical-icon"
import { SupportResource } from "@/components/support-resource"
import { cn } from "@/lib/cn"
import { getProfile, saveProfile, type CycleProfile } from "@/lib/profile"
import {
  SYMPTOM_CATEGORIES,
  countSelected,
  hasSensitiveSelected,
  type SymptomProfile,
} from "@/lib/symptom-profile"

export default function SymptomsPage() {
  const router = useRouter()
  const base = useMemo(() => getProfile(), [])
  const [sp, setSp] = useState<SymptomProfile>(base.symptomProfile ?? {})
  const [saved, setSaved] = useState(false)

  function toggle(catId: string, itemId: string) {
    setSaved(false)
    setSp((prev) => {
      const cur = prev[catId] ?? []
      const next = cur.includes(itemId) ? cur.filter((x) => x !== itemId) : [...cur, itemId]
      return { ...prev, [catId]: next }
    })
  }

  function save() {
    const profile: CycleProfile = { ...getProfile(), symptomProfile: sp }
    saveProfile({ ...profile, completedAt: profile.completedAt ?? Date.now() })
    setSaved(true)
  }

  const total = countSelected(sp)
  const sensitive = hasSensitiveSelected(sp)

  return (
    <PatientShell>
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="grid h-9 w-9 place-items-center rounded-full bg-white text-g-ink-2 shadow-girly active:scale-90" aria-label="Go back">
          <ArrowLeft size={17} />
        </button>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-candy-soft text-current">
          <MedicalIcon name="checklist" size={22} className="text-current" />
        </span>
        <div>
          <h1 className="font-cute text-3xl font-bold text-g-ink">My symptom profile</h1>
          <p className="text-sm font-semibold text-g-ink-3">Tap anything you experience.</p>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-g-lavender-soft px-4 py-3 text-sm font-bold text-g-ink">
        No pressure to fill it all in. The more complete this is, the clearer the picture for you
        and your doctor. You can edit anytime. This is never a diagnosis.
      </p>

      {sensitive && (
        <div className="mt-4">
          <SupportResource />
        </div>
      )}

      {SYMPTOM_CATEGORIES.map((cat) => {
        const sel = sp[cat.id] ?? []
        return (
          <section key={cat.id} className="mt-4 rounded-3xl border border-g-border bg-white p-4 shadow-girly">
            <h2 className="flex items-center gap-2 font-cute text-base font-bold text-g-ink">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-candy-soft text-current">
                <MedicalIcon name={cat.emoji} size={16} className="text-current" />
              </span>
              <span>{cat.title}</span>
              {sel.length > 0 && <span className="ml-auto text-sm font-bold text-g-pink-deep">{sel.length}</span>}
            </h2>
            {cat.intro && <p className="mt-0.5 text-xs font-semibold text-g-ink-3">{cat.intro}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {cat.items.map((item) => {
                const on = sel.includes(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(cat.id, item.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-95",
                      on
                        ? "border-transparent bg-candy text-white shadow-girly"
                        : item.sensitive
                          ? "border-g-pink/40 bg-g-pink-soft/40 text-g-ink-2"
                          : "border-g-border bg-g-canvas text-g-ink-2"
                    )}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <p className="mt-5 px-2 text-center text-xs font-semibold text-g-ink-3">
        {total > 0 ? `${total} selected` : "Tap the ones that sound like you"} · MyPMOS never diagnoses.
      </p>

      <button
        onClick={save}
        className="mt-3 w-full rounded-full bg-candy py-4 font-cute text-lg font-bold text-white shadow-girly-pop active:scale-[0.98]"
      >
        {saved ? "Saved" : "Save my symptom profile"}
      </button>
      <div className="h-2" />
    </PatientShell>
  )
}
