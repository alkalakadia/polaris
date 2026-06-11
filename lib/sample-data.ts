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

SAMPLE_PATIENTS.push(
  // Lean PCOS — Type A presentation in a low-BMI patient
  {
    id: "priya",
    firstName: "Priya",
    age: 26,
    appointmentTime: "9:00 AM",
    intakeCompleted: true,
    primaryConcern: "Acne and irregular periods despite normal weight",
    cycleLength: "35-60 days",
    cycleRegularity: "irregular",
    symptoms: [
      "Cycles longer than 35 days",
      "Cystic acne on jawline",
      "Coarse hair on upper lip and chin",
      "Normal weight throughout adulthood",
      "Mood swings premenstrually",
      "Fatigue after meals",
    ],
    bmi: 21.3,
    familyHistory: ["Sister: PCOS", "Father: Type 2 diabetes"],
    currentMedications: ["Spironolactone (started 2 months ago)"],
    existingLabs: [
      { name: "TSH", value: "1.9 mIU/L", flag: "normal" },
      { name: "Total testosterone", value: "62 ng/dL", flag: "high" },
    ],
    phenotype: "A",
    irLikelihood: 52,
    confidence: "high",
    reasoning: [
      "Oligo-ovulation: cycles 35-60 days (Rotterdam criterion 1)",
      "Clinical + biochemical hyperandrogenism: terminal hair, cystic acne, elevated total testosterone (Rotterdam criterion 2)",
      "Normal BMI does NOT exclude IR — lean PCOS phenotype has IR prevalence around 30-50 percent",
      "Strong family history strengthens IR pre-test probability despite BMI",
      "Already on spironolactone but underlying metabolism not yet evaluated",
    ],
    recommendedWorkup: [
      {
        test: "Fasting insulin + fasting glucose (HOMA-IR)",
        reason: "Quantify IR — lean PCOS frequently missed because BMI is normal",
        priority: "essential",
      },
      {
        test: "Hemoglobin A1c",
        reason: "Screen for early dysglycemia",
        priority: "essential",
      },
      {
        test: "Free testosterone + SHBG",
        reason: "Total testosterone is already elevated; quantify free fraction",
        priority: "essential",
      },
      {
        test: "DHEAS + 17-OH progesterone",
        reason: "Rule out adrenal source and non-classical CAH",
        priority: "essential",
      },
      {
        test: "Transvaginal pelvic ultrasound",
        reason: "Confirm phenotype A assignment",
        priority: "essential",
      },
      {
        test: "Lipid panel",
        reason: "Cardiometabolic baseline despite normal BMI",
        priority: "supportive",
      },
    ],
  },
  // Type B — anovulatory hyperandrogenism without PCO morphology
  {
    id: "jada",
    firstName: "Jada",
    age: 33,
    appointmentTime: "11:45 AM",
    intakeCompleted: true,
    primaryConcern: "Missed periods, hair loss, jawline acne",
    cycleLength: "60+ days, sometimes absent",
    cycleRegularity: "irregular",
    symptoms: [
      "Cycles longer than 60 days",
      "Hair shedding at crown and temples",
      "Adult acne on chin and jawline",
      "Mild weight gain (10 lb in 1 year)",
      "Sleep disturbances",
    ],
    bmi: 26.8,
    familyHistory: ["Mother: thyroid disorder"],
    currentMedications: ["Sertraline 50mg"],
    existingLabs: [
      { name: "TSH", value: "2.3 mIU/L", flag: "normal" },
      { name: "Free T4", value: "1.1 ng/dL", flag: "normal" },
      { name: "Pelvic ultrasound", value: "Normal ovaries, no PCO morphology", flag: "normal" },
    ],
    phenotype: "B",
    irLikelihood: 58,
    confidence: "high",
    reasoning: [
      "Oligo-ovulation: cycles >60 days, sometimes absent (Rotterdam criterion 1)",
      "Clinical hyperandrogenism: pattern hair loss + jawline acne (Rotterdam criterion 2)",
      "Ultrasound already performed and shows NO polycystic morphology",
      "Therefore: phenotype B (anovulatory hyperandrogenism without PCO morphology)",
      "Type B is sometimes the hardest to identify because the ultrasound is unremarkable",
    ],
    recommendedWorkup: [
      {
        test: "Free + total testosterone + SHBG",
        reason: "Confirm biochemical hyperandrogenism",
        priority: "essential",
      },
      {
        test: "DHEAS + 17-OH progesterone",
        reason: "Differentiate ovarian vs adrenal source; exclude non-classical CAH",
        priority: "essential",
      },
      {
        test: "Fasting insulin + glucose + A1c",
        reason: "Quantify IR given BMI 26.8 + cycle pattern",
        priority: "essential",
      },
      {
        test: "Prolactin",
        reason: "Long anovulatory pattern warrants pituitary screen",
        priority: "supportive",
      },
      {
        test: "AMH",
        reason: "Often elevated in PCOS even when PCO morphology absent",
        priority: "supportive",
      },
    ],
  },
  // Adolescent presentation — diagnostic ambiguity
  {
    id: "emma",
    firstName: "Emma",
    age: 17,
    appointmentTime: "1:15 PM",
    intakeCompleted: true,
    primaryConcern: "Mom worried about missed periods and acne (here with parent)",
    cycleLength: "Menarche at 13, still irregular at age 17 (45-90 days)",
    cycleRegularity: "irregular",
    symptoms: [
      "Persistent irregular cycles 4 years post-menarche",
      "Moderate acne on cheeks and chin",
      "Some hair on chin (started age 15)",
      "Weight stable",
      "Self-image concerns about acne",
    ],
    bmi: 23.4,
    familyHistory: ["Mother: PCOS (diagnosed at 28)"],
    currentMedications: ["OTC acne treatment"],
    existingLabs: [],
    phenotype: "A",
    irLikelihood: 45,
    confidence: "low",
    reasoning: [
      "Adolescent diagnosis is more conservative — physiologic anovulation can persist 2-3 years after menarche",
      "However: cycles still irregular 4 years post-menarche is BEYOND normal physiologic range",
      "Hyperandrogenism: clinical (terminal hair + persistent acne)",
      "Pediatric Endocrine Society 2017 recommends BOTH oligo-ovulation persistent >2 years post-menarche AND hyperandrogenism for adolescent PCOS diagnosis",
      "Ultrasound is NOT recommended for adolescent PCOS workup (multifollicular ovaries are normal at this age)",
      "Strong family history adds clinical context but does not change diagnostic criteria",
      "Confidence is low only because adolescent criteria are stricter; clinical pattern is consistent with PCOS",
    ],
    recommendedWorkup: [
      {
        test: "Free + total testosterone + SHBG",
        reason: "Confirm biochemical hyperandrogenism (especially important when clinical signs are mild)",
        priority: "essential",
      },
      {
        test: "DHEAS + 17-OH progesterone",
        reason: "Exclude non-classical CAH (more common pediatric mimic)",
        priority: "essential",
      },
      {
        test: "TSH + prolactin",
        reason: "Rule out thyroid and pituitary causes of anovulation",
        priority: "essential",
      },
      {
        test: "Fasting glucose + A1c",
        reason: "Metabolic baseline; family history of T2DM",
        priority: "supportive",
      },
      {
        test: "Counseling on diagnosis as adolescent",
        reason: "Discuss with patient and parent the difference between physiologic and pathologic anovulation; revisit in 6-12 months if criteria not met now",
        priority: "essential",
      },
    ],
  },
  // Severe IR / metabolic case
  {
    id: "rosa",
    firstName: "Rosa",
    age: 35,
    appointmentTime: "2:45 PM",
    intakeCompleted: true,
    primaryConcern: "Dark patches on neck, missed periods, exhausted all the time",
    cycleLength: "Absent 6 months, previously 50+ days",
    cycleRegularity: "absent",
    symptoms: [
      "Amenorrhea 6 months",
      "Dark velvety patches on neck (acanthosis nigricans)",
      "Multiple skin tags on neck and armpits",
      "Significant weight gain (40 lb in 3 years)",
      "Sugar cravings, post-meal crashes",
      "Snoring and daytime fatigue (possible sleep apnea)",
      "Coarse hair on chin",
    ],
    bmi: 34.2,
    familyHistory: ["Mother: Type 2 diabetes", "Father: heart disease at 52", "Sister: PCOS"],
    currentMedications: ["Multivitamin"],
    existingLabs: [
      { name: "Random glucose", value: "138 mg/dL", flag: "high" },
    ],
    phenotype: "A",
    irLikelihood: 92,
    confidence: "high",
    reasoning: [
      "Oligo/anovulation: amenorrhea 6 months (Rotterdam criterion 1)",
      "Clinical hyperandrogenism: terminal hair on chin (Rotterdam criterion 2)",
      "Acanthosis nigricans + skin tags + BMI 34 + family T2DM + elevated random glucose: severe IR phenotype",
      "Strong family cardiometabolic risk profile",
      "Possible undiagnosed sleep apnea worsens IR",
      "Urgent metabolic workup warranted; may already meet T2DM criteria",
    ],
    recommendedWorkup: [
      {
        test: "Fasting glucose + fasting insulin (HOMA-IR) + A1c",
        reason: "URGENT — likely meets prediabetes or T2DM criteria; immediate management decision",
        priority: "essential",
      },
      {
        test: "Lipid panel + AST/ALT",
        reason: "Cardiometabolic risk + assess for NAFLD given BMI and IR",
        priority: "essential",
      },
      {
        test: "Free + total testosterone + SHBG + DHEAS",
        reason: "Standard androgen workup",
        priority: "essential",
      },
      {
        test: "Endometrial assessment (transvaginal ultrasound, consider biopsy)",
        reason: "6 months amenorrhea + obesity = elevated endometrial cancer risk; assess endometrium",
        priority: "essential",
      },
      {
        test: "Sleep apnea screen (STOP-BANG or referral)",
        reason: "Snoring + daytime fatigue + obesity; treating OSA improves IR independently",
        priority: "essential",
      },
      {
        test: "Vitamin D, B12",
        reason: "Common deficiencies in this metabolic profile",
        priority: "supportive",
      },
    ],
  },
  // Post-OCP / unmasking PCOS
  {
    id: "lily",
    firstName: "Lily",
    age: 29,
    appointmentTime: "3:30 PM",
    intakeCompleted: true,
    primaryConcern: "Off birth control 6 months, periods haven't come back",
    cycleLength: "Absent 6 months post-OCP discontinuation",
    cycleRegularity: "absent",
    symptoms: [
      "Amenorrhea 6 months since stopping OCP",
      "Acne that disappeared on OCP, now returning",
      "Some chin hair returning (was suppressed on OCP)",
      "Cycles before OCP (age 15-18) were 'always weird'",
      "BMI stable",
      "Trying to conceive in next 6-12 months",
    ],
    bmi: 24.1,
    familyHistory: ["Aunt: PCOS"],
    currentMedications: ["Prenatal vitamin"],
    existingLabs: [
      { name: "TSH", value: "2.0 mIU/L", flag: "normal" },
      { name: "Prolactin", value: "13 ng/mL", flag: "normal" },
      { name: "HCG", value: "Negative", flag: "normal" },
    ],
    phenotype: "A",
    irLikelihood: 38,
    confidence: "moderate",
    reasoning: [
      "Oligo/anovulation: amenorrhea 6 months (Rotterdam criterion 1)",
      "OCP was masking pre-existing pattern — pre-OCP cycles were already irregular",
      "Clinical hyperandrogenism: acne and hair returning post-OCP (Rotterdam criterion 2)",
      "Hypothalamic causes ruled out by normal TSH/prolactin/pregnancy test",
      "Fertility-focused: prioritize confirming diagnosis and restoring ovulation",
      "Often called 'post-pill amenorrhea' but more accurately PCOS unmasked by OCP discontinuation",
    ],
    recommendedWorkup: [
      {
        test: "Free + total testosterone + SHBG + DHEAS",
        reason: "Confirm biochemical hyperandrogenism off OCP",
        priority: "essential",
      },
      {
        test: "AMH",
        reason: "Often elevated in PCOS; informs fertility planning",
        priority: "essential",
      },
      {
        test: "Transvaginal pelvic ultrasound",
        reason: "Confirm PCO morphology (criterion 3)",
        priority: "essential",
      },
      {
        test: "Fasting insulin + glucose + A1c",
        reason: "Pre-conception metabolic baseline",
        priority: "essential",
      },
      {
        test: "Day-21 progesterone (when cycle resumes) OR endometrial protection plan",
        reason: "Confirm anovulation; protect endometrium until ovulation restored",
        priority: "essential",
      },
    ],
  },
)

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
