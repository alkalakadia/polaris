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

// Default to Sonnet for cost reasons (~5x cheaper than Opus, similar
// quality on structured-output tasks like this one). Override with
// ANTHROPIC_MODEL env var if you want to upgrade for demo days.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6"

let client: Anthropic | null = null

// Simple in-memory cache so the same sample patient doesn't generate
// a new handout on every page load. Cleared on every server restart.
// Sized to comfortably fit all 8 sample patients + a few real ones.
const handoutCache = new Map<string, HandoutContent>()
const classificationCache = new Map<string, ClassificationResult>()

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

  // Cache key off the structured input — same inputs return the cached
  // classification, no API call. Sample patients hit cache after first run.
  const cacheKey = JSON.stringify(input)
  const cached = classificationCache.get(cacheKey)
  if (cached) return cached

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
    const result = parseClassificationJSON(text) ?? classifyDeterministic(input)
    classificationCache.set(cacheKey, result)
    return result
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

  // Cache by patient id — same sample patient's handout never regenerates
  // after the first request. Real patients in V2 would key by intake_id.
  const cached = handoutCache.get(patient.id)
  if (cached) return cached

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
    const result = parseHandoutJSON(text) ?? handoutFallback(patient)
    handoutCache.set(patient.id, result)
    return result
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
  // Phenotype-aware fallback templates. AI generation gives more
  // personalization, but these are clinically reasonable defaults.
  const irHeavy = patient.irLikelihood >= 60

  if (patient.phenotype === "A" || patient.phenotype === "B") {
    return {
      title: `${patient.firstName}, here's what we think and what to do next.`,
      intro:
        irHeavy
          ? "Based on your intake, your provider believes you most likely have a form of PCOS where insulin resistance is a major driver. This page summarizes what that means, what to test next, and what you can start doing today."
          : `Based on your intake answers, your provider believes you most likely have a form of PCOS called Type ${patient.phenotype}. This page summarizes what that means, what to test next, and what you can start doing today.`,
      phenotypeExplanation: irHeavy
        ? "What we suspect is that your body is producing slightly higher levels of androgens (which explains the skin and hair changes), your cycles are not running on a regular ovulation schedule, and your insulin is likely working harder than it should to keep your blood sugar stable. The insulin part matters because it drives a lot of the symptoms you're noticing, and it's the most actionable piece."
        : "What we suspect is happening: your ovaries are not releasing eggs as regularly as they should, and your body is producing slightly higher levels of androgens (which explains the skin and hair changes). Type B specifically means we did not see polycystic morphology on imaging or it wasn't required, but the clinical picture still fits PCOS.",
      nextSteps: [
        "Lab work this week: testosterone, DHEAS, fasting insulin and glucose, A1c, and a few others. We'll get them done in one blood draw.",
        "Schedule a pelvic ultrasound in the next 2 to 4 weeks if your provider has ordered one.",
        "Start tracking your cycles on your phone (any free period app is fine) so we have data when you come back.",
        "Come back in 4 to 6 weeks to review the labs and decide on a treatment plan together.",
      ],
      questionsToAsk: [
        irHeavy
          ? "Based on my results, am I a candidate for metformin or inositol to help with insulin resistance?"
          : "Based on my results, what treatment options should we discuss first?",
        "If I'm not planning to get pregnant soon, what's your recommendation for managing my cycles?",
        irHeavy
          ? "Given my family history and the insulin pattern, how often should I screen for diabetes going forward?"
          : "What lifestyle changes would have the highest impact for my specific case?",
      ],
      lifestyleIntro: irHeavy
        ? "These suggestions are tailored to the insulin resistance pattern that's most likely driving your symptoms. They're not meant to be all-or-nothing."
        : "These suggestions are tailored to your phenotype. Small changes compound over weeks.",
      lifestyleRecommendations: [
        {
          title: "Anchor each meal around protein",
          detail:
            "Aim for 25 to 35 grams of protein per meal. This blunts the blood sugar spike that drives cravings two hours later.",
        },
        {
          title: "Walk after meals",
          detail:
            "Even a 10-minute walk within 30 minutes of eating measurably lowers post-meal insulin. This is the single highest-leverage change for your phenotype.",
        },
        {
          title: "Strength train twice a week",
          detail:
            "Building lean muscle improves insulin sensitivity faster than cardio alone. Bodyweight or beginner weights is fine.",
        },
        {
          title: "Prioritize sleep over almost everything else",
          detail:
            "Less than 7 hours of sleep raises androgens and insulin both. If only one thing changes, make it this one.",
        },
        {
          title: "Skip the 'lose weight first' framing",
          detail:
            "Weight may shift with the metabolic changes above, but weight is not the cause. Focus on the metabolism, the rest follows.",
        },
      ],
    }
  }

  if (patient.phenotype === "C") {
    return {
      title: `${patient.firstName}, here's the plan to get clarity on your symptoms.`,
      intro:
        "Based on your intake, your provider wants to look into a form of PCOS called Ovulatory PCOS (Type C). Your cycles are regular, which is great, but the acne and hair pattern you described point toward higher androgen levels worth confirming.",
      phenotypeExplanation:
        "Ovulatory PCOS means your ovaries are releasing eggs on schedule, but your body may still be making higher levels of androgens than typical. That's what causes the acne pattern on your jawline and the coarse hair on your upper lip. Because your cycles are regular, this phenotype is often the most responsive to targeted treatment for the specific symptoms you care about.",
      nextSteps: [
        "Lab work this week: testosterone, DHEAS, SHBG, 17-OH progesterone in one blood draw.",
        "Schedule a pelvic ultrasound in the next 2 to 4 weeks to look at your ovaries.",
        "Take a few photos of your skin and hair pattern weekly. Helps us track response to whatever we try.",
        "Come back in 4 to 6 weeks to review labs and decide on treatment.",
      ],
      questionsToAsk: [
        "Could spironolactone help my acne and hair pattern, and what are the trade-offs?",
        "Do my labs suggest the androgens are coming from my ovaries or my adrenal glands?",
        "Would a low-dose combined birth control pill be a good fit for my specific case?",
      ],
      lifestyleIntro:
        "Your cycles are working, so we're focused on the skin and hair symptoms. These suggestions support the medical treatment options we'll discuss.",
      lifestyleRecommendations: [
        {
          title: "Build a simple, consistent skincare routine",
          detail:
            "Gentle cleanser, retinoid at night, sunscreen during the day. Skip the 7-step routines, they irritate hormonal acne more.",
        },
        {
          title: "Reduce dairy for 6 weeks and watch the response",
          detail:
            "Dairy has been linked to androgen-driven acne in some women. Six weeks gives a fair test. Note any change with photos.",
        },
        {
          title: "Manage stress through any sustainable method",
          detail:
            "Cortisol amplifies adrenal androgen output. Whatever method actually works for you, do that.",
        },
        {
          title: "Avoid extreme low-carb diets",
          detail:
            "Very restrictive diets stress the cycle and can backfire. Your insulin is likely not the main driver here.",
        },
      ],
    }
  }

  // Type D — non-hyperandrogenic / fertility-focused
  return {
    title: `${patient.firstName}, here's the plan to understand your cycles and prepare for pregnancy.`,
    intro:
      "Based on your intake, your provider believes you may have a form of PCOS called Non-Hyperandrogenic PCOS (Type D). Your cycles have been long and recently missed, and we want to identify exactly what's happening before you try to conceive.",
    phenotypeExplanation:
      "This form of PCOS means your ovaries may not be releasing eggs on a predictable schedule, even though you don't have the classic acne and hair pattern of other PCOS types. The most important thing for you right now is restoring regular ovulation so you have predictable opportunities to conceive. Many women with this phenotype respond very well to targeted treatment.",
    nextSteps: [
      "Lab work this week: testosterone, DHEAS, AMH, fasting insulin, glucose, A1c, and a few more.",
      "Schedule a pelvic ultrasound in the next 2 to 3 weeks.",
      "Track basal body temperature daily (or use a fertility app you trust). We need a sense of whether you're ovulating at all right now.",
      "Come back in 3 to 4 weeks to review labs and discuss next steps for fertility planning.",
    ],
    questionsToAsk: [
      "Am I a candidate for letrozole to induce ovulation, and what's the success rate for someone with my profile?",
      "How long should we try ovulation induction before considering other fertility options?",
      "Are there any preconception risks specific to PCOS I should know about?",
    ],
    lifestyleIntro:
      "These suggestions support the fertility-focused treatment plan we'll discuss. Small changes compound.",
    lifestyleRecommendations: [
      {
        title: "Continue the prenatal vitamin",
        detail:
          "Make sure it includes 400 to 800 mcg of folate. Start at least 3 months before trying to conceive.",
      },
      {
        title: "Anchor meals around protein and fiber",
        detail:
          "Stable blood sugar supports regular ovulation. Aim for 25 grams of protein per meal.",
      },
      {
        title: "Consistent moderate exercise",
        detail:
          "30 minutes of walking 5 days a week is the sweet spot. Excessive exercise can suppress cycles, so don't overdo it.",
      },
      {
        title: "Limit alcohol",
        detail:
          "Both for fertility outcomes and because cycle tracking is more reliable when alcohol is minimized.",
      },
      {
        title: "Sleep is a fertility intervention",
        detail:
          "Aim for 7 to 9 hours. Cycle regularity improves measurably with consistent sleep.",
      },
    ],
  }
}
