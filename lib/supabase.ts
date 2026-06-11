/**
 * Supabase client for Polaris.
 *
 * Two clients:
 *
 *  - serverClient(): uses SUPABASE_SERVICE_ROLE_KEY, server-only. For
 *    intake persistence, encounter writes, anything that touches the
 *    longitudinal data layer.
 *
 *  - browserClient(): uses NEXT_PUBLIC_SUPABASE_ANON_KEY, safe in the
 *    browser. For provider-facing reads after auth lands. Not used in V1.
 *
 * V1 schema (migrations live in /supabase/migrations/):
 *   intakes (id, created_at, intake_data jsonb)
 *   classifications (id, intake_id, phenotype, ir_likelihood, confidence, reasoning jsonb)
 *   handouts (id, classification_id, content jsonb, generated_at)
 *
 * When SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set, the
 * intake submit handler logs the payload and returns success without
 * persisting. This keeps the prototype functional on Vercel without
 * needing a Supabase project provisioned first.
 */

import { createClient } from "@supabase/supabase-js"

export interface IntakeRow {
  id: string
  created_at: string
  intake_data: Record<string, string | string[]>
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

export function serverClient() {
  if (!isSupabaseConfigured()) return null
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    }
  )
}

export function browserClient() {
  if (!isSupabaseConfigured()) return null
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Persists raw intake submission. Returns the new row id (uuid) or
 * null when Supabase isn't configured.
 */
export async function saveIntake(
  intakeData: Record<string, string | string[]>
): Promise<string | null> {
  const client = serverClient()
  if (!client) {
    console.log("Supabase not configured; intake logged only:", intakeData)
    return null
  }
  const { data, error } = await client
    .from("intakes")
    .insert({ intake_data: intakeData })
    .select("id")
    .single()
  if (error) {
    console.error("saveIntake error:", error)
    return null
  }
  return data?.id ?? null
}

/**
 * Saves a classification result tied to an intake. Returns the new
 * classification row id, or null when Supabase isn't configured.
 */
export async function saveClassification(
  intakeId: string,
  classification: {
    phenotype: string
    irLikelihood: number
    confidence: string
    reasoning: string[]
    model?: string
    aiPowered: boolean
  }
): Promise<string | null> {
  const client = serverClient()
  if (!client) return null
  const { data, error } = await client
    .from("classifications")
    .insert({
      intake_id: intakeId,
      phenotype: classification.phenotype,
      ir_likelihood: classification.irLikelihood,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      model: classification.model ?? null,
      ai_powered: classification.aiPowered,
    })
    .select("id")
    .single()
  if (error) {
    console.error("saveClassification error:", error)
    return null
  }
  return data?.id ?? null
}

/**
 * Returns recent intakes joined with their latest classification.
 * Used by the provider dashboard to show real submissions.
 */
export interface RealIntakeRow {
  id: string
  created_at: string
  intake_data: Record<string, string | string[]>
  classification: {
    phenotype: string
    ir_likelihood: number
    confidence: string
    reasoning: string[]
  } | null
}

export async function getRecentIntakes(limit = 20): Promise<RealIntakeRow[]> {
  const client = serverClient()
  if (!client) return []
  const { data, error } = await client
    .from("intakes")
    .select(
      `id, created_at, intake_data,
       classifications ( phenotype, ir_likelihood, confidence, reasoning, created_at )`
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) {
    console.error("getRecentIntakes error:", error)
    return []
  }
  return (data ?? []).map((row) => {
    const c = (row as { classifications?: unknown }).classifications
    const latest =
      Array.isArray(c) && c.length > 0
        ? (c as Array<{
            phenotype: string
            ir_likelihood: number
            confidence: string
            reasoning: string[]
            created_at: string
          }>).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
        : null
    return {
      id: row.id as string,
      created_at: row.created_at as string,
      intake_data: row.intake_data as Record<string, string | string[]>,
      classification: latest
        ? {
            phenotype: latest.phenotype,
            ir_likelihood: latest.ir_likelihood,
            confidence: latest.confidence,
            reasoning: latest.reasoning,
          }
        : null,
    }
  })
}

export async function getIntakeById(id: string): Promise<RealIntakeRow | null> {
  const client = serverClient()
  if (!client) return null
  const { data, error } = await client
    .from("intakes")
    .select(
      `id, created_at, intake_data,
       classifications ( phenotype, ir_likelihood, confidence, reasoning, created_at )`
    )
    .eq("id", id)
    .single()
  if (error) {
    console.error("getIntakeById error:", error)
    return null
  }
  const c = (data as { classifications?: unknown }).classifications
  const latest =
    Array.isArray(c) && c.length > 0
      ? (c as Array<{
          phenotype: string
          ir_likelihood: number
          confidence: string
          reasoning: string[]
          created_at: string
        }>).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
      : null
  return {
    id: data.id as string,
    created_at: data.created_at as string,
    intake_data: data.intake_data as Record<string, string | string[]>,
    classification: latest
      ? {
          phenotype: latest.phenotype,
          ir_likelihood: latest.ir_likelihood,
          confidence: latest.confidence,
          reasoning: latest.reasoning,
        }
      : null,
  }
}
