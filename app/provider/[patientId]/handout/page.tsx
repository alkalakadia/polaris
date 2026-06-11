import Link from "next/link"
import { notFound } from "next/navigation"
import { getPatientById, PHENOTYPE_LABELS, type SamplePatient } from "@/lib/sample-data"

export default async function HandoutPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const patient = getPatientById(patientId)
  if (!patient) notFound()

  const content = generateHandoutContent(patient)

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/provider/${patient.id}`} className="text-sm text-slate-500 hover:text-slate-900">
              ← Chart
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <span className="text-sm font-semibold tracking-tight">Polaris handout</span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              generated in 6.2s
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`mailto:?subject=Your visit summary&body=Hi ${patient.firstName}, attached is your visit summary.`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Email
            </a>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
        <article className="rounded-xl border border-slate-200 bg-white p-10 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          {/* Letterhead */}
          <header className="flex items-center justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="text-xl font-semibold tracking-tight">Polaris</div>
              <div className="mt-0.5 text-xs text-slate-500">
                UW Health Women's Clinic · Dr. Sarah Chen
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              For: {patient.firstName}, age {patient.age}
              <br />
              Visit date: Today
            </div>
          </header>

          <div className="mt-8">
            <h1 className="text-2xl font-semibold leading-tight">{content.title}</h1>
            <p className="mt-3 text-sm text-slate-700">{content.intro}</p>
          </div>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              What we think is going on
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-800">{content.phenotypeExplanation}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Your next steps
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-800">
              {content.nextSteps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Three questions to bring back next visit
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-800">
              {content.questionsToAsk.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-lg bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Lifestyle, matched to your phenotype
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              {content.lifestyleIntro}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-800">
              {content.lifestyleRecommendations.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span>
                    <span className="font-medium">{r.title}.</span> {r.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">
            <p>
              <strong>Sources:</strong> Endocrine Society Clinical Practice Guidelines 2023,
              Rotterdam ESHRE/ASRM-Sponsored PCOS Consensus Workshop Group 2018, AE-PCOS Society 2009.
            </p>
            <p className="mt-2">
              This handout is a summary of today's discussion. It is not a substitute for medical
              advice. Call our office at (608) 263-6240 with questions or concerns.
            </p>
          </section>
        </article>
      </section>
    </main>
  )
}

/**
 * In V1 this content is hardcoded per phenotype.
 * V2 will swap this for an LLM call with a structured prompt that fills slots
 * against a curated content template (not free-form generation).
 */
function generateHandoutContent(patient: SamplePatient) {
  if (patient.phenotype === "A") {
    return {
      title: `${patient.firstName}, here's what we think and what to do next.`,
      intro:
        "Based on your intake answers, your provider believes you most likely have a form of PCOS called Classic PCOS (Type A). This page summarizes what that means, what to test next, and what you can start doing today.",
      phenotypeExplanation:
        "Classic PCOS means three things are likely happening at once: your ovaries are not releasing eggs as regularly as they should, your body is producing slightly higher levels of androgens (which is why you're seeing the chin hair and jawline acne), and your insulin is probably working harder than it should to keep your blood sugar steady. The insulin part is important because it drives a lot of the symptoms you're noticing.",
      nextSteps: [
        "Lab work this week: testosterone, DHEAS, fasting insulin and glucose, A1c, and a few others. We'll get them done in one blood draw.",
        "Schedule a pelvic ultrasound in the next 2 to 4 weeks. This is to look at your ovaries directly.",
        "Start tracking your cycles on your phone (any free period app is fine) so we have data when you come back.",
        "Come back in 4 to 6 weeks to review the labs and decide on a treatment plan together.",
      ],
      questionsToAsk: [
        "Based on my results, am I a candidate for metformin or inositol to help with insulin resistance?",
        "If I'm not planning to get pregnant soon, what is your recommendation for managing my cycles?",
        "Given my family history, how often should I screen for diabetes going forward?",
      ],
      lifestyleIntro:
        "These suggestions are tailored to the insulin resistance pattern that's most likely driving your symptoms. They're not meant to be all-or-nothing.",
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
        "Ovulatory PCOS means your ovaries are releasing eggs on schedule, but your body may still be making higher levels of androgens than typical. That's what causes the acne pattern on your jawline and the coarse hair on your upper lip. The good news: because your cycles are regular, this phenotype is often the most responsive to targeted treatment for the specific symptoms you care about.",
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
