/**
 * POST /api/upload-lab
 *
 * Multipart form upload of a lab-result photo. Stored in the
 * `lab-photos` bucket on Supabase Storage. Returns the public URL.
 *
 * For V1 we use a public bucket so the provider chart can <img> the URL
 * directly. V2 adds signed URLs + private bucket once we have provider
 * auth and HIPAA infrastructure in place.
 */

import { NextResponse } from "next/server"
import { serverClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB cap per photo

export async function POST(req: Request) {
  const client = serverClient()
  if (!client) {
    return NextResponse.json(
      { error: "Storage not configured (Supabase env vars missing)" },
      { status: 503 }
    )
  }

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 })
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files allowed" }, { status: 415 })
  }

  // Path: anonymous/<uuid>.<ext> so unrelated intakes don't collide.
  // We don't have an intake id yet at upload time (photos come before
  // the final submit), so we group them all under "anonymous/" and let
  // the intake submission persist the path references.
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const path = `anonymous/${crypto.randomUUID()}.${ext}`

  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: uploadError } = await client.storage
    .from("lab-photos")
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    })

  if (uploadError) {
    console.error("upload-lab error:", uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = client.storage.from("lab-photos").getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl, path })
}
