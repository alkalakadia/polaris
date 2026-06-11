/**
 * POST /api/handout
 *
 * Body: { patientId: string }
 * Returns: HandoutContent (always — falls back to a deterministic template
 *          when ANTHROPIC_API_KEY isn't set).
 *
 * Why a POST: the handout payload is patient-specific and we want to
 * disable Next's static caching for these responses. Live generation
 * each time the provider opens the handout view.
 */

import { NextResponse } from "next/server"
import { generateHandout } from "@/lib/anthropic"
import { getPatientById } from "@/lib/sample-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { patientId?: string } | null
  if (!body?.patientId) {
    return NextResponse.json({ error: "Missing patientId" }, { status: 400 })
  }

  const patient = getPatientById(body.patientId)
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  }

  const startedAt = Date.now()
  const content = await generateHandout(patient)
  const generatedInMs = Date.now() - startedAt

  return NextResponse.json({
    content,
    generatedInMs,
    aiPowered: Boolean(process.env.ANTHROPIC_API_KEY),
  })
}
