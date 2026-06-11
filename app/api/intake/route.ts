/**
 * POST /api/intake
 *
 * Body: { answers: Record<string, string | string[]> }
 * Returns: { intakeId: string | null, classification?: ClassificationResult }
 *
 * - Persists to Supabase if configured; logs only otherwise.
 * - Synchronously classifies the intake (via Claude or deterministic
 *   fallback) so the provider view has a result the moment they open
 *   the patient's chart.
 */

import { NextResponse } from "next/server"
import { classifyPhenotype, type ClassificationInput } from "@/lib/anthropic"
import { saveIntake, saveClassification } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { answers: Record<string, string | string[]> }
    | null
  if (!body?.answers) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 })
  }

  const intakeId = await saveIntake(body.answers)
  const classification = await classifyPhenotype(toClassificationInput(body.answers))

  // Persist classification so the provider dashboard can show it without
  // re-running the classifier on every page load.
  if (intakeId) {
    await saveClassification(intakeId, {
      phenotype: classification.phenotype,
      irLikelihood: classification.irLikelihood,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      aiPowered: Boolean(process.env.ANTHROPIC_API_KEY),
    })
  }

  return NextResponse.json({
    intakeId,
    classification,
    persistedToSupabase: Boolean(intakeId),
  })
}

function toClassificationInput(
  answers: Record<string, string | string[]>
): ClassificationInput {
  const cycleLength = (answers["cycle_length"] as string) || ""
  const cycleRegularity: "regular" | "irregular" | "absent" = cycleLength.includes(
    "21 to 35"
  )
    ? "regular"
    : cycleLength.toLowerCase().includes("no period")
    ? "absent"
    : "irregular"

  return {
    primaryConcern: (answers["primary_concern"] as string) || "Not specified",
    cycleLength,
    cycleRegularity,
    symptoms: (answers["symptoms"] as string[]) || [],
    familyHistory: (answers["family_history"] as string[]) || [],
    existingLabs: [],
  }
}
