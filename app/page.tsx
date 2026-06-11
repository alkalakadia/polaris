import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400" />
            <span className="text-lg font-semibold tracking-tight">Polaris</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/intake" className="hover:text-slate-900">
              Patient intake demo
            </Link>
            <Link
              href="/provider"
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            >
              Provider view
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-6 inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          UW Madison SAIL 2026 · Early prototype
        </div>
        <h1 className="text-5xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-6xl">
          The PCOS workflow tool every OB/GYN should already have.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          1 in 10 women have PCOS. The average diagnosis takes 4 to 7 years. Polaris turns a
          5-minute patient intake into a single-screen phenotype classification, recommended workup,
          and a personalized handout, ready before the patient walks into the room.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/provider"
            className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            See the provider view
          </Link>
          <Link
            href="/intake"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Try the patient intake
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 sm:grid-cols-3">
          <FeatureCard
            number="01"
            title="Patient intake on her phone"
            description="A 5-minute SMS-linked intake covering cycle history, symptoms, family history, and existing labs. Mobile-first, no app install."
          />
          <FeatureCard
            number="02"
            title="Phenotype + workup in one screen"
            description="Rotterdam classification with reasoning, insulin resistance likelihood, and a prioritized lab workup with evidence citations. Ready before you walk in the room."
          />
          <FeatureCard
            number="03"
            title="Personalized patient handout"
            description="A one-click handout matched to her phenotype, lifestyle, and goals. Printable, emailable, ready to hand off at the end of the appointment."
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">Why this exists</h2>
        <div className="mt-6 space-y-4 text-slate-700">
          <p>
            The OB/GYN sees 3 to 5 possible PCOS cases a week with 12 minutes per visit and no
            decision support built for the condition. UpToDate is a reference book. Epic has no PCOS
            module. The Endocrine Society guideline is 47 pages. Meanwhile her patient walked in
            with a TikTok-driven hypothesis.
          </p>
          <p>
            Polaris is not a consumer app. It is the workflow tool that captures structured patient
            input before the visit, runs Rotterdam classification and an IR likelihood score against
            published criteria, and generates a personalized patient handout in seconds. The doctor
            looks smart, the patient feels heard, and the path to evidence-based care collapses from
            14 weeks to one visit.
          </p>
          <p>
            We are looking for 10 OB/GYNs to give us 25 minutes of feedback on this prototype this
            summer. If that is you,{" "}
            <a
              href="mailto:alka.lakadia@wiscai.com"
              className="font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-700"
            >
              email us
            </a>
            .
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
          <p>
            Polaris is a clinical decision support prototype. It does not diagnose or treat. Always
            apply clinical judgment. Built at UW Madison Summer of AI Lab 2026.
          </p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-xs font-medium text-indigo-600">{number}</div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  )
}
