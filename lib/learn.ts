/** Curated Learn topics. Article bodies are generated on demand by Gemini
 *  (grounded, safe) — see app/api/ask. This list is the evolving "syllabus";
 *  the "Latest research" feed and Ask Polaris add fresh, cited content on top. */

import type { CycleProfile } from "@/lib/profile"

export interface Article {
  id: string
  topic: string
  emoji: string
  title: string
  blurb: string
  read: string
  brief: string // what the explainer should cover (sent to the model)
  tags: string[] // relevance keys: goals, concern ids, symptom category ids
  fresh?: boolean
  tint: string
}

export const TOPICS = [
  "For you",
  "PCOS 101",
  "Insulin & food",
  "Skin & hair",
  "Fertility",
  "Mental health",
  "New research",
]

export const ARTICLES: Article[] = [
  {
    id: "pcos-101",
    topic: "PCOS 101",
    emoji: "🌸",
    tint: "bg-g-pink-soft",
    title: "What PCOS actually is (in plain words)",
    blurb: "The four phenotypes, why periods get irregular, and what the name really means.",
    read: "5 min",
    tags: ["understand", "cycle", "irregular"],
    brief:
      "A beginner-friendly overview of PCOS: what it is, the Rotterdam criteria and the four phenotypes (A/B/C/D) at a high level, why ovulation and periods become irregular, and that 'polycystic' is a bit of a misnomer.",
  },
  {
    id: "insulin-resistance",
    topic: "Insulin & food",
    emoji: "🍓",
    tint: "bg-g-mint-soft",
    title: "Insulin resistance, explained gently",
    blurb: "Why so many of us hear about it, and small food swaps research actually supports.",
    read: "6 min",
    tags: ["insulin", "weight", "symptoms", "cravings"],
    brief:
      "What insulin resistance is, how it connects to PCOS symptoms and androgens, and evidence-supported lifestyle approaches (balanced meals, fiber, protein, movement) in general, non-prescriptive terms.",
  },
  {
    id: "inositol-2026",
    topic: "New research",
    emoji: "🔬",
    tint: "bg-g-lavender-soft",
    fresh: true,
    title: "What the research says about inositol",
    blurb: "A clear look at myo- vs d-chiro-inositol and what current studies suggest.",
    read: "4 min",
    tags: ["insulin", "regulate", "symptoms"],
    brief:
      "An evidence-based summary of inositol in PCOS: myo-inositol vs d-chiro-inositol, the commonly studied 40:1 ratio, what trials suggest about cycle regularity and insulin markers, and honest limitations. No doses or prescriptions.",
  },
  {
    id: "skin-hair",
    topic: "Skin & hair",
    emoji: "✨",
    tint: "bg-g-peach-soft",
    title: "Hirsutism & acne: your options",
    blurb: "From everyday care to talking to a derm — what each approach is and isn't.",
    read: "7 min",
    tags: ["hair", "acne", "hairloss", "symptoms"],
    brief:
      "Why PCOS can cause acne and unwanted hair (androgens), and the general categories of approaches (skincare, hair-removal methods, and the kinds of treatments a doctor or dermatologist might discuss) without giving prescriptions.",
  },
  {
    id: "mood",
    topic: "Mental health",
    emoji: "💗",
    tint: "bg-g-sky-soft",
    title: "PCOS and your mood",
    blurb: "The link between hormones and how you feel, and when to reach out for support.",
    read: "5 min",
    tags: ["mood", "fatigue"],
    brief:
      "The connection between PCOS and mental health (higher rates of anxiety and depression), why that happens, gentle self-support ideas, and a clear nudge to seek professional support when needed.",
  },
  {
    id: "fertility",
    topic: "Fertility",
    emoji: "🤍",
    tint: "bg-g-pink-soft",
    title: "PCOS & trying to conceive",
    blurb: "How PCOS affects ovulation, and the paths people explore with their doctor.",
    read: "6 min",
    tags: ["fertility", "ttc"],
    brief:
      "How PCOS affects ovulation and fertility, the general landscape of options people discuss with their care team, and encouragement that many people with PCOS conceive. Non-prescriptive, no specific protocols.",
  },
]

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id)
}

// --- read state (on-device) --------------------------------------------------

const READ_KEY = "polaris.learn.read.v1"

export function getReadIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(READ_KEY) || "[]") as string[]
  } catch {
    return []
  }
}

export function isRead(id: string): boolean {
  return getReadIds().includes(id)
}

export function toggleRead(id: string): string[] {
  const cur = getReadIds()
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
  if (typeof window !== "undefined") window.localStorage.setItem(READ_KEY, JSON.stringify(next))
  return next
}

export function markRead(id: string): void {
  const cur = getReadIds()
  if (!cur.includes(id) && typeof window !== "undefined") {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...cur, id]))
  }
}

// --- personalization ---------------------------------------------------------

/** The user's "interest set" for ranking + research: goal, concerns, symptoms. */
export function interestKeys(profile: CycleProfile): Set<string> {
  const keys = new Set<string>()
  if (profile.goal) keys.add(profile.goal)
  for (const c of profile.concerns ?? []) keys.add(c)
  for (const cat of Object.keys(profile.symptomProfile ?? {})) {
    if ((profile.symptomProfile?.[cat] ?? []).length > 0) keys.add(cat)
  }
  return keys
}

/** Rank curated articles by overlap with the user's interests (stable). */
export function rankArticles(profile: CycleProfile): Article[] {
  const keys = interestKeys(profile)
  return ARTICLES.map((a, i) => {
    const score = a.tags.reduce((n, t) => n + (keys.has(t) ? 1 : 0), 0)
    return { a, score, i }
  })
    .sort((x, y) => (y.score - x.score) || x.i - y.i)
    .map((x) => x.a)
}

/** A short, human phrase describing interests for the research query. */
export function interestTopics(profile: CycleProfile): string {
  const bits: string[] = []
  if (profile.goal === "ttc") bits.push("is trying to conceive")
  else if (profile.goal === "regulate") bits.push("wants to regulate their cycle")
  else if (profile.goal === "symptoms") bits.push("wants to manage symptoms")
  else if (profile.goal === "weight") bits.push("cares about weight and energy")
  const concernSet = interestKeys(profile)
  const named = ["acne", "hair", "mood", "fertility", "insulin", "weight", "irregular"].filter((k) => concernSet.has(k))
  if (named.length) bits.push(`is dealing with ${named.join(", ")}`)
  return bits.join(" and ")
}
