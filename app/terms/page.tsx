"use client"

import { PatientShell } from "@/components/patient-shell"

const UPDATED = "July 2, 2026"
const CONTACT = "hello@polaris.app"

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-5 font-cute text-lg font-bold text-g-ink">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm font-medium leading-relaxed text-g-ink-2">{children}</p>
}
function LI({ children }: { children: React.ReactNode }) {
  return <li className="text-sm font-medium leading-relaxed text-g-ink-2">{children}</li>
}

export default function TermsPage() {
  return (
    <PatientShell>
      <h1 className="font-cute text-3xl font-bold text-g-ink">Terms of Use</h1>
      <p className="mt-1 text-xs font-semibold text-g-ink-3">Last updated {UPDATED}</p>

      <div className="mt-3 rounded-2xl bg-g-pink-soft px-4 py-3 text-sm font-bold text-g-ink">
        Important: MyPMOS is a wellness and education tool, not medical care. It does not diagnose, treat, or replace a
        doctor. Always talk to a qualified professional about your health.
      </div>

      <H>Not medical advice</H>
      <P>
        MyPMOS provides general wellness information, self-tracking, and educational content. It does not provide
        medical advice, diagnosis, or treatment, and using it does not create a doctor-patient relationship. Insights,
        summaries, and any AI responses are informational only and may be incomplete or wrong. Always seek the advice of
        your physician or another qualified provider with questions about a medical condition, and never disregard or
        delay professional advice because of something you read in MyPMOS.
      </P>

      <H>In an emergency</H>
      <P>
        MyPMOS is not for emergencies. If you think you may have a medical emergency, call your local emergency number
        (911 in the US) right away. If you are in crisis or thinking about harming yourself, call or text 988 (the US
        Suicide &amp; Crisis Lifeline) or your local crisis line.
      </P>

      <H>Who can use MyPMOS</H>
      <P>
        You must be at least 13 years old to use MyPMOS. If you are under the age of majority where you live, you may
        use it only with the involvement and consent of a parent or guardian. By using MyPMOS you confirm this is true.
      </P>

      <H>Your account</H>
      <P>
        Keep your login secure and don&apos;t share it. You are responsible for activity under your account. Enter
        information that is accurate to the best of your knowledge; MyPMOS relies on what you provide.
      </P>

      <H>Community rules</H>
      <P>MyPMOS includes a peer community. Content there is written by members, not medical professionals, and is not medical advice. When you post, you agree to:</P>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <LI>Be kind and respectful; no harassment, hate, or bullying.</LI>
        <LI>Not share medical misinformation, or promote unproven &ldquo;cures,&rdquo; products, or supplements.</LI>
        <LI>Not post others&apos; private information, spam, or illegal content.</LI>
        <LI>Only post content you have the right to share; avoid posting identifying photos of yourself or others.</LI>
      </ul>
      <P>
        You keep ownership of what you post but grant MyPMOS a license to display it within the app. We may remove
        content or suspend accounts that break these rules, and you can report content you believe violates them.
      </P>

      <H>Acceptable use</H>
      <P>Don&apos;t misuse the service: no attempts to break security, scrape data, disrupt the service, or use it to harm others.</P>

      <H>No warranties</H>
      <P>
        MyPMOS is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, to the
        fullest extent allowed by law. We do not guarantee that it will be accurate, uninterrupted, or error-free.
      </P>

      <H>Limitation of liability</H>
      <P>
        To the fullest extent permitted by law, MyPMOS and its creators are not liable for any indirect, incidental, or
        consequential damages, or for any health decisions made based on the app. Your use of MyPMOS is at your own
        discretion and risk.
      </P>

      <H>Changes and contact</H>
      <P>
        We may update these Terms; we will update the date above and, for significant changes, notify you in the app.
        Continued use means you accept the changes. These Terms are governed by the laws of the State of Wisconsin, USA.
        Questions: {CONTACT}.
      </P>

      <p className="mt-6 rounded-2xl bg-g-lavender-soft px-4 py-3 text-xs font-semibold text-g-ink">
        MyPMOS is in early testing. These Terms are in plain language and are being finalized with legal review before
        public launch.
      </p>
    </PatientShell>
  )
}
