/**
 * Layer 2 — the comprehensive PMOS symptom profile.
 *
 * The full symptom landscape, consolidated into prioritized, clinically-useful
 * categories. The user reviews this ONCE (and edits anytime), so we capture
 * breadth without daily friction. Selections flow into the gyno PDF, the AI
 * context, and risk-screening prompts.
 *
 * `sensitive: true` items (self-harm, disordered eating) trigger a supportive
 * resource — they are never just a silent checkbox.
 *
 * Categories are ordered by clinical value: hyperandrogenism + cycle (Rotterdam
 * signals) first, then insulin resistance, then mental health, etc.
 */

export interface SymptomItem {
  id: string
  label: string
  sensitive?: boolean
}

export interface SymptomCategory {
  id: string
  title: string
  emoji: string
  intro?: string
  items: SymptomItem[]
}

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: "cycle",
    title: "Periods & ovulation",
    emoji: "🌙",
    items: [
      { id: "irregular", label: "Irregular periods" },
      { id: "infrequent", label: "Infrequent periods" },
      { id: "missing", label: "Missing periods" },
      { id: "long", label: "Long cycles (over 35 days)" },
      { id: "unpredictable", label: "Unpredictable cycles" },
      { id: "light", label: "Very light periods" },
      { id: "heavy", label: "Very heavy periods" },
      { id: "prolonged", label: "Prolonged bleeding" },
      { id: "spotting", label: "Spotting between periods" },
      { id: "painful", label: "Painful periods" },
      { id: "anovulation", label: "Cycles without ovulation" },
      { id: "fertilewindow", label: "Hard to track fertile windows" },
    ],
  },
  {
    id: "hair",
    title: "Excess hair growth",
    emoji: "💇‍♀️",
    intro: "Where do you notice unwanted or coarser hair?",
    items: [
      { id: "lip", label: "Upper lip" },
      { id: "chin", label: "Chin" },
      { id: "jaw", label: "Jawline / sideburns" },
      { id: "neck", label: "Neck" },
      { id: "chest", label: "Chest" },
      { id: "stomach", label: "Stomach / lower belly" },
      { id: "back", label: "Back" },
      { id: "thighs", label: "Inner thighs" },
      { id: "arms", label: "Arms" },
      { id: "coarse", label: "Coarser / darker hair" },
      { id: "regrowth", label: "Fast regrowth after shaving" },
    ],
  },
  {
    id: "acne",
    title: "Acne & oily skin",
    emoji: "🔴",
    items: [
      { id: "persistent", label: "Persistent / adult acne" },
      { id: "jawacne", label: "Jawline acne" },
      { id: "chinacne", label: "Chin acne" },
      { id: "neckacne", label: "Neck acne" },
      { id: "backacne", label: "Back / chest acne" },
      { id: "cystic", label: "Deep / cystic acne" },
      { id: "oily", label: "Oily skin" },
      { id: "pores", label: "Enlarged pores" },
      { id: "resistant", label: "Acne despite treatment" },
    ],
  },
  {
    id: "hairloss",
    title: "Hair thinning & loss",
    emoji: "🪮",
    items: [
      { id: "thinning", label: "Thinning hair" },
      { id: "part", label: "Widening part" },
      { id: "crown", label: "Crown thinning" },
      { id: "hairline", label: "Receding hairline" },
      { id: "shedding", label: "Excessive shedding" },
    ],
  },
  {
    id: "insulin",
    title: "Insulin-resistance signs",
    emoji: "🍬",
    intro: "Often missed but very common with PMOS.",
    items: [
      { id: "hunger", label: "Constant hunger" },
      { id: "postmeal", label: "Fatigue / crash after meals" },
      { id: "shaky", label: "Shaky when hungry" },
      { id: "cravings", label: "Strong sugar / carb cravings" },
      { id: "bellyfat", label: "Belly / central weight gain" },
      { id: "acanthosis", label: "Dark velvety skin (neck, underarms, groin)" },
      { id: "skintags", label: "Skin tags" },
    ],
  },
  {
    id: "weight",
    title: "Weight & appetite",
    emoji: "⚖️",
    items: [
      { id: "gain", label: "Weight gain" },
      { id: "hardtolose", label: "Hard to lose weight" },
      { id: "regain", label: "Weight regain after dieting" },
      { id: "increasedhunger", label: "Increased hunger" },
      { id: "lowsatiety", label: "Never feel full" },
    ],
  },
  {
    id: "mood",
    title: "Mood & mental health",
    emoji: "💭",
    intro: "Very common with PMOS, and worth caring for.",
    items: [
      { id: "anxiety", label: "Anxiety" },
      { id: "depression", label: "Low mood / depression" },
      { id: "moodswings", label: "Mood swings" },
      { id: "irritable", label: "Irritability" },
      { id: "lowselfesteem", label: "Low self-esteem" },
      { id: "bodyimage", label: "Body-image distress" },
      { id: "emotionaleating", label: "Emotional eating" },
      { id: "disordered", label: "Disordered / binge eating", sensitive: true },
      { id: "selfharm", label: "Thoughts of self-harm", sensitive: true },
    ],
  },
  {
    id: "energy",
    title: "Energy & focus",
    emoji: "🔋",
    items: [
      { id: "fatigue", label: "Fatigue / low energy" },
      { id: "brainfog", label: "Brain fog" },
      { id: "concentration", label: "Hard to concentrate" },
      { id: "motivation", label: "Low motivation" },
      { id: "memory", label: "Memory slips" },
    ],
  },
  {
    id: "sleep",
    title: "Sleep",
    emoji: "😴",
    items: [
      { id: "poorsleep", label: "Poor sleep quality" },
      { id: "insomnia", label: "Insomnia" },
      { id: "waking", label: "Frequent waking" },
      { id: "unrefreshing", label: "Unrefreshing sleep" },
      { id: "snoring", label: "Snoring" },
      { id: "daysleepy", label: "Very sleepy in the day" },
      { id: "morningheadache", label: "Morning headaches" },
    ],
  },
  {
    id: "fertility",
    title: "Fertility",
    emoji: "🤍",
    items: [
      { id: "conceive", label: "Trouble getting pregnant" },
      { id: "delayed", label: "Delayed conception" },
      { id: "miscarriage", label: "Recurrent miscarriage" },
      { id: "irregularwindows", label: "Irregular fertile windows" },
    ],
  },
  {
    id: "intimacy",
    title: "Intimacy",
    emoji: "💗",
    intro: "Totally optional — share only what feels comfortable.",
    items: [
      { id: "libido", label: "Low libido" },
      { id: "dryness", label: "Vaginal dryness" },
      { id: "pain", label: "Pain with intercourse" },
      { id: "arousal", label: "Difficulty with arousal" },
    ],
  },
  {
    id: "other",
    title: "Other",
    emoji: "🌷",
    items: [
      { id: "bloating", label: "Bloating" },
      { id: "pelvic", label: "Pelvic pain / discomfort" },
      { id: "headaches", label: "Headaches / migraines" },
      { id: "waterretention", label: "Water retention / puffiness" },
      { id: "muscle", label: "Hard to build muscle" },
      { id: "recovery", label: "Slow exercise recovery" },
      { id: "heat", label: "Heat intolerance" },
    ],
  },
]

export type SymptomProfile = Record<string, string[]> // categoryId -> item ids

export function categoryById(id: string): SymptomCategory | undefined {
  return SYMPTOM_CATEGORIES.find((c) => c.id === id)
}

export function labelForItem(catId: string, itemId: string): string | undefined {
  return categoryById(catId)?.items.find((i) => i.id === itemId)?.label
}

/** Total selected across all categories. */
export function countSelected(sp: SymptomProfile | undefined): number {
  if (!sp) return 0
  return Object.values(sp).reduce((n, ids) => n + ids.length, 0)
}

/** Whether any sensitive item (self-harm / disordered eating) is selected. */
export function hasSensitiveSelected(sp: SymptomProfile | undefined): boolean {
  if (!sp) return false
  for (const cat of SYMPTOM_CATEGORIES) {
    const sel = sp[cat.id] ?? []
    if (cat.items.some((i) => i.sensitive && sel.includes(i.id))) return true
  }
  return false
}
