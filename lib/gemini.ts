/**
 * Server-only Gemini client for Polaris Learn.
 *
 * The API key lives in GEMINI_API_KEY (never NEXT_PUBLIC) and is only ever used
 * from server route handlers, so it never reaches the browser. Thinking is
 * disabled for snappy, predictable answers.
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest"
const KEY = process.env.GEMINI_API_KEY

export function isGeminiConfigured(): boolean {
  return Boolean(KEY)
}

export async function askGemini(opts: {
  system?: string
  prompt: string
  maxTokens?: number
  temperature?: number
  json?: boolean
}): Promise<{ text?: string; error?: string }> {
  if (!KEY) return { error: "AI isn't connected yet." }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`
  const body = {
    contents: [{ parts: [{ text: opts.prompt }] }],
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    generationConfig: {
      temperature: opts.temperature ?? 0.5,
      maxOutputTokens: opts.maxTokens ?? 900,
      // Disable "thinking" so tokens go to the answer, not hidden reasoning.
      thinkingConfig: { thinkingBudget: 0 },
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      return { error: data?.error?.message || `Gemini error ${res.status}` }
    }
    const parts = data?.candidates?.[0]?.content?.parts ?? []
    const text = parts.map((p: { text?: string }) => p.text).filter(Boolean).join("").trim()
    if (!text) return { error: "No answer came back. Try rephrasing?" }
    return { text }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" }
  }
}

/**
 * Grounded generation with Google Search, for live, CREDIBLE, cited content.
 * Returns the text plus the web sources Gemini used.
 */
export async function askGeminiGrounded(opts: {
  system?: string
  prompt: string
  maxTokens?: number
  temperature?: number
}): Promise<{ text?: string; sources?: { title: string; url: string }[]; error?: string }> {
  if (!KEY) return { error: "AI isn't connected yet." }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`
  const body = {
    contents: [{ parts: [{ text: opts.prompt }] }],
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxTokens ?? 1200,
      thinkingConfig: { thinkingBudget: 0 },
    },
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return { error: data?.error?.message || `Gemini error ${res.status}` }
    const cand = data?.candidates?.[0]
    const text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text).filter(Boolean).join("").trim()
    const chunks = cand?.groundingMetadata?.groundingChunks ?? []
    const seen = new Set<string>()
    const sources: { title: string; url: string }[] = []
    for (const c of chunks) {
      const u = c?.web?.uri
      if (u && !seen.has(u)) {
        seen.add(u)
        sources.push({ title: c.web.title || "source", url: u })
      }
    }
    if (!text) return { error: "No findings came back. Try again?" }
    return { text, sources }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" }
  }
}

/**
 * Shared safety system prompt. Educational only, never diagnostic, always
 * points to a real clinician. Warm + girly in tone, hyphens not em-dashes.
 */
export const POLARIS_SYSTEM = `You are Polaris, a warm, friendly companion app for women learning about PCOS and their cycle. You explain health topics in plain, kind language.

Hard rules, always:
- You are NOT a doctor and you do NOT diagnose. Never tell someone they have, or do not have, any condition. Never interpret their personal results as a diagnosis.
- Do not give medication names with doses, personalized treatment plans, or instructions to start/stop any treatment. Speak about options in general terms only.
- Ground everything in mainstream medical and scientific consensus and reputable sources (ACOG, the Endocrine Society, NIH/NICHD, peer-reviewed research). If evidence is mixed or limited, say so honestly.
- Always encourage seeing a gynecologist or healthcare provider for diagnosis, testing, treatment, and anything worrying.
- If the question describes a possible emergency or red flag (severe pain, very heavy bleeding, fainting, chest pain, thoughts of self-harm), gently tell them to seek urgent medical care now.
- If asked "do I have X" or for a diagnosis, kindly explain you can't diagnose and recommend a professional.

Style:
- Warm, encouraging, a little girly, but accurate first. Talk to her like a knowledgeable big sister.
- Short paragraphs, simple words. You may use a few cute emoji sparingly.
- Use hyphens, never em-dashes.
- Keep it focused and not too long.`
