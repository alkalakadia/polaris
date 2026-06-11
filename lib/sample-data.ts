/**
 * Hardcoded sample patient data for demo purposes.
 * Used in V1 to show OB/GYNs what the experience looks like before
 * we wire up real AI + persistent storage.
 *
 * Three personas spanning the most common PCOS phenotypes:
 *  - Sarah: Type A (classic PCOS, all 3 Rotterdam criteria, high IR likelihood)
 *  - Maya:  Type C (non-classic, hyperandrogenism + PCO morphology, normal cycles)
 *  - Aisha: Type D (non-hyperandrogenic, anovulation + PCO morphology)
 */

export type Phenotype = "A" | "B" | "C" | "D" | "Unlikely"

export interface SamplePatient {
  id: string
  firstName: string
  age: number
  appointmentTime: string
  intakeCompleted: boolean
  primaryConcern: string
  cycleLength: string
  cycleRegularity: "regular" | "irregular" | "absent"
  symptoms: string[]
  bmi: number
  familyHistory: string[]
  currentMedications: string[]
  existingLabs: { name: string; value: string; flag?: "high" | "low" | "normal" }[]
  phenotype: Phenotype
  irLikelihood: number
  confidence: "high" | "moderate" | "low"
  reasoning: string[]
  recommendedWorkup: { test: string; reason: string; priority: "essential" | "supportive" }[]
}

export const SAMPLE_PATIENTS: SamplePatient[] = [
  {
    id: "sarah",
    firstName: "Sarah",
    age: 28,
    appointmentTime: "10:30 AM",
    intakeCompleted: true,
    primaryConcern: "Irregular periods, weight gain, new chin hair",
    cycleLength: "35-50 days",
    cycleRegularity: "irregular",
    symptoms: [
      "Cycles longer than 35 days",
      "Acne on chin and jawline",
      "New coarse hair on chin",
      "Weight gain around midsection (15 lb in 2 years)",
      "Skin tags on neck",
      "Sugar cravings",
      "Hair thinning at crown",
    ],
    bmi: 28.4,
    familyHistory: ["Mother: PCOS", "Aunt: Type 2 diabetes"],
    currentMedications: ["Multivitamin", "Vitamin D"],
    existingLabs: [
      { name: "TSH", value: "2.1 mIU/L", flag: "normal" },
      { name: "Prolactin", value: "14 ng/mL", flag: "normal" },
    ],
    phenotype: "A",
    irLikelihood: 78,
    confidence: "high",
    reasoning: [
      "Oligo-ovulation: cycles routinely 35-50 days (Rotterdam criterion 1)",
      "Clinical hyperandrogenism: chin terminal hair + jawline acne + crown thinning (Rotterdam criterion 2)",
      "BMI 28.4 + acanthosis-adjacent findings (skin tags, central adiposity, sugar cravings) raise IR likelihood substantially",
      "Family history of PCOS in mother and T2DM in aunt reinforces metabolic phenotype",
      "Existing labs (TSH, prolactin) appropriately exclude thyroid and pituitary mimics",
    ],
    recommendedWorkup: [
      {
        test: "Free testosterone + total testosterone + SHBG",
        reason: "Confirm biochemical hyperandrogenism (Rotterdam #2)",
        priority: "essential",
      },
      {
        test: "DHEAS",
        reason: "Rule out adrenal source of hyperandrogenism",
        priority: "essential",
      },
      {
        test: "17-OH progesterone",
        reason: "Exclude non-classical congenital adrenal hyperplasia",
        priority: "essential",
      },
      {
        test: "Fasting insulin + fasting glucose (HOMA-IR)",
        reason: "Quantify IR given high pre-test probability (BMI, skin tags, family history)",
        priority: "essential",
      },
      {
        test: "Hemoglobin A1c",
        reason: "Screen for prediabetes / undiagnosed T2DM",
        priority: "essential",
      },
      {
        test: "Lipid panel",
        reason: "Cardiometabolic risk assessment per Endocrine Society 2023",
        priority: "supportive",
      },
      {
        test: "AMH",
        reason: "Supportive of PCO morphology (alternative when transvaginal US not available)",
        priority: "supportive",
      },
      {
        test: "Transvaginal pelvic ultrasound",
        reason: "Assess ovarian morphology (Rotterdam #3) — confirms diagnosis if biochemistry equivocal",
        priority: "supportive",
      },
    ],
  },
  {
    id: "maya",
    firstName: "Maya",
    age: 24,
    appointmentTime: "11:15 AM",
    intakeCompleted: true,
    primaryConcern: "Severe acne, jawline hair, periods regular",
    cycleLength: "28-30 days",
    cycleRegularity: "regular",
    symptoms: [
      "Cystic acne on jawline and chin",
      "Coarse hair on upper lip and jawline",
      "Periods regular at 28-30 days",
      "Normal weight",
    ],
    bmi: 22.1,
    familyHistory: ["No family history reported"],
    currentMedications: ["Topical tretinoin"],
    existingLabs: [],
    phenotype: "C",
    irLikelihood: 32,
    confidence: "moderate",
    reasoning: [
      "Clinical hyperandrogenism: cystic acne pattern + terminal hair on upper lip / jawline (Rotterdam #2)",
      "Regular cycles — does NOT meet anovulation criterion",
      "Normal BMI — IR likelihood lower but not zero (lean PCOS pattern exists)",
      "Confirms phenotype C (non-classic) only IF pelvic ultrasound shows PCO morphology AND biochemistry confirms",
      "Need biochemistry before assigning phenotype with high confidence",
    ],
    recommendedWorkup: [
      {
        test: "Free + total testosterone + SHBG",
        reason: "Confirm biochemical hyperandrogenism",
        priority: "essential",
      },
      {
        test: "DHEAS + 17-OH progesterone",
        reason: "Rule out adrenal source and non-classical CAH",
        priority: "essential",
      },
      {
        test: "Transvaginal pelvic ultrasound",
        reason: "Required for phenotype C assignment (PCO morphology)",
        priority: "essential",
      },
      {
        test: "Fasting insulin + glucose",
        reason: "Lean PCOS subset has IR in 20-30 percent; worth establishing baseline",
        priority: "supportive",
      },
    ],
  },
  {
    id: "aisha",
    firstName: "Aisha",
    age: 31,
    appointmentTime: "2:00 PM",
    intakeCompleted: true,
    primaryConcern: "Trying to conceive, periods absent 3 months",
    cycleLength: "Absent 3 months, previously 45+ days",
    cycleRegularity: "absent",
    symptoms: [
      "Amenorrhea x 3 months",
      "Historically long cycles (45+ days)",
      "No acne, no hirsutism",
      "BMI 24.5",
      "Negative pregnancy test 2 weeks ago",
    ],
    bmi: 24.5,
    familyHistory: ["Mother: PCOS (diagnosed at 35)"],
    currentMedications: ["Prenatal vitamin"],
    existingLabs: [
      { name: "TSH", value: "2.8 mIU/L", flag: "normal" },
      { name: "Prolactin", value: "11 ng/mL", flag: "normal" },
      { name: "HCG", value: "Negative", flag: "normal" },
    ],
    phenotype: "D",
    irLikelihood: 41,
    confidence: "moderate",
    reasoning: [
      "Oligo-/anovulation: amenorrhea 3 months on background of long cycles (Rotterdam #1)",
      "No clinical hyperandrogenism reported",
      "Phenotype D requires PCO morphology on ultrasound — pending",
      "Family history of PCOS in mother strengthens pre-test probability",
      "Fertility-focused visit changes urgency: prioritize anovulation workup",
    ],
    recommendedWorkup: [
      {
        test: "Transvaginal pelvic ultrasound",
        reason: "Required for phenotype D assignment (PCO morphology)",
        priority: "essential",
      },
      {
        test: "Free + total testosterone + SHBG + DHEAS",
        reason: "Establish androgen baseline even though clinical signs absent",
        priority: "essential",
      },
      {
        test: "AMH",
        reason: "Strongly elevated in PCOS; informs fertility planning",
        priority: "essential",
      },
      {
        test: "Day-21 progesterone (if cycle resumes) OR endometrial assessment",
        reason: "Confirm anovulation",
        priority: "essential",
      },
      {
        test: "Fasting insulin + glucose + A1c",
        reason: "Pre-conception metabolic assessment",
        priority: "essential",
      },
      {
        test: "Semen analysis (partner)",
        reason: "Standard fertility workup before initiating ovulation induction",
        priority: "supportive",
      },
    ],
  },
]

export function getPatientById(id: string): SamplePatient | undefined {
  return SAMPLE_PATIENTS.find((p) => p.id === id)
}

export const PHENOTYPE_LABELS: Record<Phenotype, { name: string; criteria: string }> = {
  A: {
    name: "Classic PCOS (Type A)",
    criteria: "Oligo-ovulation + hyperandrogenism + polycystic ovaries",
  },
  B: {
    name: "Anovulatory hyperandrogenism (Type B)",
    criteria: "Oligo-ovulation + hyperandrogenism (no PCO morphology)",
  },
  C: {
    name: "Ovulatory PCOS (Type C)",
    criteria: "Hyperandrogenism + polycystic ovaries (regular cycles)",
  },
  D: {
    name: "Non-hyperandrogenic PCOS (Type D)",
    criteria: "Oligo-ovulation + polycystic ovaries (no hyperandrogenism)",
  },
  Unlikely: {
    name: "PCOS unlikely",
    criteria: "Insufficient Rotterdam criteria met",
  },
}
