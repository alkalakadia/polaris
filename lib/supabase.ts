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
