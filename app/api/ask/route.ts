import { NextResponse } from "next/server"
import { POLARIS_SYSTEM, askGemini, askGeminiGrounded, isGeminiConfigured } from "@/lib/gemini"

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

  let payload: { mode?: string; question?: string; title?: string; topic?: string; context?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 })
  }

  const mode =
    payload.mode === "explainer"
      ? "explainer"
      : payload.mode === "research"
        ? "research"
        : payload.mode === "freshtopics"
          ? "freshtopics"
          : "qa"

  // Fresh, personalized article ideas (regenerated on demand) — the main feed
  // keeps producing new things to read.
  if (mode === "freshtopics") {
    const topics = ((payload as { topics?: string }).topics || "").trim().slice(0, 300)
    const seed = ((payload as { seed?: string }).seed || "").slice(0, 20)
    const { text, error } = await askGemini({
      system: POLARIS_SYSTEM,
      json: true,
      temperature: 0.9,
      maxTokens: 900,
      prompt: `Suggest 4 fresh, specific, genuinely useful PMOS (formerly PCOS) article ideas${
        topics ? ` for someone who ${topics}` : ""
      }. Vary them (seed ${seed}). Each needs: "title" (catchy, specific), "blurb" (one warm line), "brief" (one sentence describing what the article should cover, grounded in mainstream research, non-diagnostic), "topic" (one of: PMOS 101, Insulin & food, Skin & hair, Fertility, Mental health, New research), and "emoji" (one). Return ONLY a JSON array of 4 objects with keys: title, blurb, brief, topic, emoji.`,
    })
    if (error) return NextResponse.json({ error }, { status: 502 })
    let articles: unknown = []
    try {
      articles = JSON.parse(text || "[]")
    } catch {
      articles = []
    }
    return NextResponse.json({ articles })
  }

  // Live, credible, cited research from the web (Google Search grounding).
  if (mode === "research") {
    const topics = ((payload as { topics?: string }).topics || "").trim().slice(0, 300)
    const { text, sources, error } = await askGeminiGrounded({
      system: POLARIS_SYSTEM,
      prompt: `Share 2-3 recent, credible, noteworthy findings or guidance about PMOS (formerly PCOS)${
        topics ? `, especially relevant to someone who: ${topics}` : ""
      }. Use ONLY reputable sources (peer-reviewed journals, ACOG, the Endocrine Society, NIH/NICHD, major health institutions, or reputable medical news). For each: a short "**Bold title**" line, then 1-2 plain, encouraging sentences. Keep it clear and warm. Do not diagnose.`,
      maxTokens: 1000,
    })
    if (error) return NextResponse.json({ error }, { status: 502 })
    return NextResponse.json({ answer: text, sources: sources ?? [] })
  }

  if (mode === "qa") {
    const question = (payload.question || "").trim()
    if (!question) return NextResponse.json({ error: "Ask a question first 💕" }, { status: 400 })
    if (question.length > 1000) return NextResponse.json({ error: "That's a bit long — try a shorter question." }, { status: 400 })

    // Optional, non-identifying health context to personalize the answer.
    const ctx = (payload.context || "").trim().slice(0, 600)
    const contextBlock = ctx
      ? `\n\nContext about the person asking (use it to tailor your answer, but do NOT restate it as established fact or diagnose): ${ctx}`
      : ""

    const { text, error } = await askGemini({
      system: POLARIS_SYSTEM,
      prompt: `A user of the MyPMOS app asks: "${question}"${contextBlock}\n\nAnswer helpfully in under ~180 words, gently personalized to her context where relevant. End with one short line reminding her this is general info, not medical advice, and to check with her doctor.`,
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
    prompt: `Write a friendly, accurate explainer for the MyPMOS Learn page.\n\nTitle: "${title}"\nWhat it should cover: ${topic || title}\n\nFormat: 250-350 words. Open with one warm sentence. Then 2-4 short sections, each with a bold "**Section heading**" on its own line followed by a short paragraph. You may use a couple of bullet points with "- ". Keep it grounded in mainstream research. End with a gentle reminder that this is general education, not medical advice, and to talk to her gynecologist.`,
    maxTokens: 1100,
    temperature: 0.55,
  })
  if (error) return NextResponse.json({ error }, { status: 502 })
  return NextResponse.json({ answer: text })
}
