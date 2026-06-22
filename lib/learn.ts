/** Curated Learn topics. Content is generated on demand by Gemini (grounded,
 *  safe) — see app/api/ask. This list is the "syllabus." */

export interface Article {
  id: string
  topic: string
  emoji: string
  title: string
  blurb: string
  read: string
  brief: string // what the explainer should cover (sent to the model)
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
    brief:
      "How PCOS affects ovulation and fertility, the general landscape of options people discuss with their care team, and encouragement that many people with PCOS conceive. Non-prescriptive, no specific protocols.",
  },
]

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id)
}
