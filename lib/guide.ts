/**
 * Evidence-based PMOS (formerly PCOS) basics — anchored to the 2023 International
 * Evidence-Based Guideline for the Assessment and Management of PMOS.
 *
 * Dr. Sood named diet/exercise confusion as the #1 patient pain point, and
 * stressed accuracy and evidence over AI opinion. So this is static, curated,
 * guideline-aligned content (no AI generation), framed as general information,
 * never personal medical advice.
 */

export interface MythFact {
  myth: string
  fact: string
}

/** Myth vs fact, weighted toward the diet/exercise confusion clinicians see most. */
export const MYTHS: MythFact[] = [
  {
    myth: "There's one special PMOS diet I have to follow (keto, gluten-free, dairy-free...).",
    fact: "No single diet is proven best for PMOS. Guidelines say the most effective eating pattern is a balanced, nutritionally adequate one you can actually sustain. Extreme restriction often backfires.",
  },
  {
    myth: "If I just lose weight, my PMOS will go away.",
    fact: "PMOS isn't caused by weight (lean women have it too), and there's no cure, only management. For those carrying extra weight, a modest 5-10% loss can ease symptoms, but healthy lifestyle helps everyone regardless of size.",
  },
  {
    myth: "Exercise only counts if it's intense.",
    fact: "Guidelines recommend 150-300 minutes a week of moderate activity (like brisk walking), plus muscle-strengthening twice a week. Consistency matters more than intensity.",
  },
  {
    myth: "Carbs are the enemy.",
    fact: "You don't need to cut out carbs. Quality and balance matter more, whole grains and fiber, and pairing carbs with protein or healthy fat to steady blood sugar.",
  },
  {
    myth: "Supplements, teas, or 'detoxes' can fix or cure PMOS.",
    fact: "No supplement or product is proven to cure PMOS, and many marketed ones lack evidence (and can be a waste of money). Talk to your doctor before buying anything that promises a fix.",
  },
  {
    myth: "Eating very little or skipping meals will help.",
    fact: "Severe restriction isn't recommended and can make things worse. Regular, balanced meals that you can keep up are the goal.",
  },
  {
    myth: "PMOS means I can't get pregnant.",
    fact: "Many women with PMOS conceive, with or without help. It's a common and often treatable cause of fertility challenges, not a closed door.",
  },
]

export interface GuideFact {
  emoji: string
  title: string
  body: string
}

/** What the 2023 international guidelines actually say (lifestyle focus). */
export const GUIDELINE_FACTS: GuideFact[] = [
  {
    emoji: "🌱",
    title: "Lifestyle comes first, for everyone",
    body: "Healthy eating, movement, and sleep are recommended first-line for all women with PMOS, for overall health and how you feel, not just for weight, and whether you're lean or not.",
  },
  {
    emoji: "🏃‍♀️",
    title: "Movement: aim for 150-300 min a week",
    body: "At least 150-300 minutes of moderate activity weekly (or 75-150 of vigorous), plus muscle-strengthening on 2 days. More (around 250+ min) supports weight goals. Reducing long sitting helps too.",
  },
  {
    emoji: "🥗",
    title: "Food: balanced and sustainable beats 'perfect'",
    body: "No single diet is best. General healthy eating, plenty of whole foods, fiber, and protein, that fits your life and culture is what works. Any calorie reduction (only if you have a weight goal) should be modest and healthy.",
  },
  {
    emoji: "⚖️",
    title: "Weight isn't the whole story",
    body: "For those with extra weight, a 5-10% loss can improve cycles, skin, and metabolism. But PMOS affects normal-weight women too, and it's never only about a number on the scale.",
  },
  {
    emoji: "💗",
    title: "Mental health is part of care",
    body: "Anxiety and depression are more common with PMOS and are part of guideline care. Screening and support matter, your feelings are not 'in your head'.",
  },
  {
    emoji: "😴",
    title: "Sleep and sleep apnea matter",
    body: "Poor sleep affects mood and insulin. If you snore or feel very sleepy by day, it's worth asking your doctor to screen for sleep apnea.",
  },
]
