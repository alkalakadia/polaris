/**
 * Anthropic client + clinical-grade prompts for Polaris.
 *
 * Two AI surfaces:
 *
 *  1. classifyPhenotype() — takes structured intake data, returns
 *     Rotterdam phenotype + IR likelihood + reasoning. Falls back to
 *     a deterministic rule engine when ANTHROPIC_API_KEY is missing
 *     (e.g., on demo deployments without keys configured).
 *
 *  2. generateHandout() — takes a classified patient, returns a
 *     personalized 1-page handout in strict JSON schema. Slot-filling
 *     against a curated content scaffold; not free-form generation.
 *
 * Both are server-only. Never import from a Client Component.
 */

import Anthropic from "@anthropic-ai/sdk"
import type { Phenotype, SamplePatient } from "./sample-data"

const MODEL = "claude-opus-4-5"

let client: Anthropic | null = null

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

export interface ClassificationInput {
  primaryConcern: string
  cycleRegularity: "regular" | "irregular" | "absent"
  cycleLength: string
  symptoms: string[]
  bmi?: number
  familyHistory: string[]
  existingLabs: { name: string; value: string }[]
}

export interface ClassificationResult {
  phenotype: Phenotype
  irLikelihood: number
  confidence: "high" | "moderate" | "low"
  reasoning: string[]
}

/**
 * Classifies a patient against Rotterdam 2003/2018 criteria and estimates
 * IR likelihood from clinical signals. Always returns a result (falls back
 * to rule engine on missing key / API failure).
 */
export async function classifyPhenotype(
  input: ClassificationInput
): Promise<ClassificationResult> {
  const c = getClient()
  if (!c) return classifyDeterministic(input)

  const prompt = buildClassificationPrompt(input)
  try {
    const message = await c.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: CLASSIFICATION_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    })
    const text =
      message.content[0]?.type === "text" ? message.content[0].text : ""
    return parseClassificationJSON(text) ?? classifyDeterministic(input)
  } catch (err) {
    console.error("classifyPhenotype error, falling back:", err)
    return classifyDeterministic(input)
  }
}

export interface HandoutContent {
  title: string
  intro: string
  phenotypeExplanation: string
  nextSteps: string[]
  questionsToAsk: string[]
  lifestyleIntro: string
  lifestyleRecommendations: { title: string; detail: string }[]
}

/**
 * Generates a personalized patient handout matched to the patient's
 * phenotype, BMI, age, family history, and stated goals. Strict JSON
 * output with hand-curated scaffold so the LLM fills slots rather than
 * writing free-form medical content.
 */
export async function generateHandout(
  patient: SamplePatient
): Promise<HandoutContent> {
  const c = getClient()
  if (!c) return handoutFallback(patient)

  const prompt = buildHandoutPrompt(patient)
  try {
    const message = await c.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: HANDOUT_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    })
    const text =
      message.content[0]?.type === "text" ? message.content[0].text : ""
    return parseHandoutJSON(text) ?? handoutFallback(patient)
  } catch (err) {
    console.error("generateHandout error, falling back:", err)
    return handoutFallback(patient)
  }
}

// =========================================================================
// PROMPTS
// =========================================================================

const CLASSIFICATION_SYSTEM = `You are a clinical decision support assistant trained on the Rotterdam 2003/2018 criteria for PCOS and the Endocrine Society 2023 Clinical Practice Guidelines.

You classify patient cases into one of five categories:
  - Type A: oligo-ovulation + hyperandrogenism + polycystic ovaries
  - Type B: oligo-ovulation + hyperandrogenism (no PCO morphology)
  - Type C: hyperandrogenism + polycystic ovaries (regular cycles)
  - Type D: oligo-ovulation + polycystic ovaries (no hyperandrogenism)
  - Unlikely: insufficient Rotterdam criteria met

You estimate insulin resistance (IR) likelihood as a percent (0-100) using:
  - BMI
  - Acanthosis nigricans, skin tags
  - Post-meal energy crashes / sugar cravings
  - Family history of T2DM
  - Existing glucose / insulin / A1c results if provided

You provide reasoning as a numbered list of clinical observations tied to specific criteria.

Output STRICT JSON ONLY, no markdown, no preamble:
{
  "phenotype": "A" | "B" | "C" | "D" | "Unlikely",
  "irLikelihood": <integer 0-100>,
  "confidence": "high" | "moderate" | "low",
  "reasoning": ["<observation 1>", "<observation 2>", ...]
}

Confidence is "low" only when criteria are partially met or critical data is missing (e.g., no ultrasound yet, adolescent patient with insufficient post-menarche interval).

This is decision support, not a diagnosis. The provider makes the call. Be specific. Cite the criterion number when relevant.`

function buildClassificationPrompt(input: ClassificationInput): string {
  return `Classify this patient.

Primary concern: ${input.primaryConcern}
Cycle regularity: ${input.cycleRegularity}
Cycle length: ${input.cycleLength}
BMI: ${input.bmi ?? "unknown"}
Symptoms reported: ${input.symptoms.join(", ") || "none"}
Family history: ${input.familyHistory.join(", ") || "none reported"}
Existing labs: ${
    input.existingLabs.map((l) => `${l.name}: ${l.value}`).join("; ") || "none"
  }

Return strict JSON only.`
}

const HANDOUT_SYSTEM = `You generate personalized patient handouts for women just diagnosed with (or being worked up for) PCOS. The handout is single-page, plain-English, and patient-centered.

You DO NOT diagnose. You DO NOT prescribe. You explain, you suggest discussion topics, and you give lifestyle suggestions matched to the patient's specific phenotype and goals.

You output STRICT JSON in this exact schema, no markdown, no preamble:
{
  "title": "<warm, first-name addressed title>",
  "intro": "<1-2 sentence summary of what the handout covers>",
  "phenotypeExplanation": "<2-3 sentence plain-English explanation of what their specific phenotype means, written for an 8th-grade reading level>",
  "nextSteps": ["<step 1>", "<step 2>", "<step 3>", "<step 4>"],
  "questionsToAsk": ["<question 1>", "<question 2>", "<question 3>"],
  "lifestyleIntro": "<1 sentence framing for the lifestyle section, matched to phenotype>",
  "lifestyleRecommendations": [
    { "title": "<short action verb phrase>", "detail": "<1-2 sentence explanation>" },
    ...
  ]
}

Match recommendations to phenotype:
  - Type A: heavy emphasis on IR-driven advice (protein-first, post-meal walks, sleep, strength training)
  - Type B: similar to A but emphasize the diagnostic ambiguity gracefully
  - Type C: skin/hair management, anti-inflammatory lifestyle, do NOT emphasize weight loss
  - Type D: fertility-focused, cycle support, preconception preparation
  - High IR (>60%): aggressive IR-focused recommendations
  - Adolescent: gentle, education-first, no scary framing, parent included

Always 4-5 lifestyle recommendations. Always 3 questions to ask. Always 4 next steps. Never use medical jargon without immediate plain-English follow-up.

Cite zero brands or specific medications. Suggest discussion topics, not prescriptions.

Tone: warm, calm, knowledgeable, never alarmist.`

function buildHandoutPrompt(patient: SamplePatient): string {
  return `Generate a personalized patient handout for ${patient.firstName}.

Age: ${patient.age}
Phenotype: ${patient.phenotype}
IR likelihood: ${patient.irLikelihood}%
BMI: ${patient.bmi}
Primary concern stated by patient: ${patient.primaryConcern}
Symptoms reported: ${patient.symptoms.join(", ")}
Family history: ${patient.familyHistory.join(", ")}
Currently taking: ${patient.currentMedications.join(", ") || "nothing"}

Return strict JSON only.`
}

// =========================================================================
// PARSERS
// =========================================================================

function parseClassificationJSON(text: string): ClassificationResult | null {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    if (
      !parsed.phenotype ||
      typeof parsed.irLikelihood !== "number" ||
      !Array.isArray(parsed.reasoning)
    ) {
      return null
    }
    return parsed as ClassificationResult
  } catch {
    return null
  }
}

function parseHandoutJSON(text: string): HandoutContent | null {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    if (
      !parsed.title ||
      !parsed.intro ||
      !Array.isArray(parsed.nextSteps) ||
      !Array.isArray(parsed.questionsToAsk) ||
      !Array.isArray(parsed.lifestyleRecommendations)
    ) {
      return null
    }
    return parsed as HandoutContent
  } catch {
    return null
  }
}

// =========================================================================
// DETERMINISTIC FALLBACKS
// =========================================================================

function classifyDeterministic(input: ClassificationInput): ClassificationResult {
  const hasOligoAnovulation =
    input.cycleRegularity !== "regular" ||
    input.cycleLength.toLowerCase().includes("35") ||
    input.cycleLength.toLowerCase().includes("absent")

  const hyperandrogenicSymptoms = input.symptoms.filter(
    (s) =>
      s.toLowerCase().includes("hair on") ||
      s.toLowerCase().includes("acne") ||
      s.toLowerCase().includes("hair thinning") ||
      s.toLowerCase().includes("hair loss")
  )
  const hasHyperandrogenism = hyperandrogenicSymptoms.length > 0

  let phenotype: Phenotype = "Unlikely"
  if (hasOligoAnovulation && hasHyperandrogenism) phenotype = "A"
  else if (hasOligoAnovulation && !hasHyperandrogenism) phenotype = "D"
  else if (!hasOligoAnovulation && hasHyperandrogenism) phenotype = "C"

  // IR likelihood from rough proxies
  let ir = 25
  if (input.bmi && input.bmi >= 30) ir += 30
  else if (input.bmi && input.bmi >= 25) ir += 15
  if (
    input.symptoms.some((s) => s.toLowerCase().includes("skin tags") || s.toLowerCase().includes("velvety"))
  )
    ir += 20
  if (input.symptoms.some((s) => s.toLowerCase().includes("sugar craving") || s.toLowerCase().includes("crashes")))
    ir += 10
  if (input.familyHistory.some((f) => f.toLowerCase().includes("diabetes"))) ir += 15
  ir = Math.min(95, Math.max(5, ir))

  return {
    phenotype,
    irLikelihood: ir,
    confidence: phenotype === "Unlikely" ? "low" : "moderate",
    reasoning: [
      "Deterministic fallback classifier (ANTHROPIC_API_KEY not configured)",
      hasOligoAnovulation
        ? "Oligo-/anovulation present based on cycle pattern"
        : "Cycles appear regular — anovulation criterion not met",
      hasHyperandrogenism
        ? `Clinical hyperandrogenism: ${hyperandrogenicSymptoms.slice(0, 2).join(", ")}`
        : "No clinical hyperandrogenism reported",
      "Configure ANTHROPIC_API_KEY in Vercel env to enable Claude-powered classification with reasoning.",
    ],
  }
}

function handoutFallback(patient: SamplePatient): HandoutContent {
  return {
    title: `${patient.firstName}, here's a summary of today's visit.`,
    intro: `This is a placeholder handout. Configure ANTHROPIC_API_KEY to enable personalized AI-generated content.`,
    phenotypeExplanation: `Your provider is evaluating you for ${patient.phenotype === "Unlikely" ? "PCOS but the picture isn't clear yet" : `Type ${patient.phenotype} PCOS`}. The next steps below will help clarify the picture.`,
    nextSteps: [
      "Complete the lab work recommended by your provider in the next week.",
      "Schedule a pelvic ultrasound if recommended.",
      "Start tracking your cycles on a phone app.",
      "Return for follow-up in 4 to 6 weeks to review labs.",
    ],
    questionsToAsk: [
      "Based on my results, what treatment options should we discuss?",
      "Are there lifestyle changes that would have the highest impact for my specific case?",
      "How often should we follow up going forward?",
    ],
    lifestyleIntro: "General PCOS lifestyle suggestions. Your provider can tailor these to your specific case.",
    lifestyleRecommendations: [
      {
        title: "Anchor each meal around protein",
        detail: "25 to 35 grams of protein per meal supports blood sugar stability.",
      },
      {
        title: "Move after meals",
        detail: "A 10-minute walk within 30 minutes of eating lowers post-meal insulin.",
      },
      {
        title: "Prioritize sleep",
        detail: "Less than 7 hours raises androgens and insulin both.",
      },
      {
        title: "Consider strength training",
        detail: "Building lean muscle improves insulin sensitivity faster than cardio alone.",
      },
    ],
  }
}
