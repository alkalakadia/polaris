import { NextResponse } from "next/server"
import { POLARIS_SYSTEM, askGemini, isGeminiConfigured } from "@/lib/gemini"

export const runtime = "nodejs"

/**
 * Learn's brain. Two modes:
 *   - "qa": answer a user's question, grounded + safe.
 *   - "explainer": write a friendly article on a curated topic.
 */
export async function POST(req: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "AI isn't connected yet." }, { status: 503 })
  }

  let payload: { mode?: string; question?: string; title?: string; topic?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 })
  }

  const mode = payload.mode === "explainer" ? "explainer" : "qa"

  if (mode === "qa") {
    const question = (payload.question || "").trim()
    if (!question) return NextResponse.json({ error: "Ask a question first 💕" }, { status: 400 })
    if (question.length > 1000) return NextResponse.json({ error: "That's a bit long — try a shorter question." }, { status: 400 })

    const { text, error } = await askGemini({
      system: POLARIS_SYSTEM,
      prompt: `A user of the Polaris app asks: "${question}"\n\nAnswer helpfully in under ~180 words. End with one short line reminding her this is general info, not medical advice, and to check with her doctor.`,
      maxTokens: 700,
      temperature: 0.5,
    })
    if (error) return NextResponse.json({ error }, { status: 502 })
    return NextResponse.json({ answer: text })
  }

  // explainer
  const title = (payload.title || "").trim()
  const topic = (payload.topic || "").trim()
  if (!title) return NextResponse.json({ error: "Missing topic." }, { status: 400 })

  const { text, error } = await askGemini({
    system: POLARIS_SYSTEM,
    prompt: `Write a friendly, accurate explainer for the Polaris Learn page.\n\nTitle: "${title}"\nWhat it should cover: ${topic || title}\n\nFormat: 250-350 words. Open with one warm sentence. Then 2-4 short sections, each with a bold "**Section heading**" on its own line followed by a short paragraph. You may use a couple of bullet points with "- ". Keep it grounded in mainstream research. End with a gentle reminder that this is general education, not medical advice, and to talk to her gynecologist.`,
    maxTokens: 1100,
    temperature: 0.55,
  })
  if (error) return NextResponse.json({ error }, { status: 502 })
  return NextResponse.json({ answer: text })
}
