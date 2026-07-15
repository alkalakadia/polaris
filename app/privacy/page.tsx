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

export default function PrivacyPage() {
  return (
    <PatientShell>
      <h1 className="font-cute text-3xl font-bold text-g-ink">Privacy Policy</h1>
      <p className="mt-1 text-xs font-semibold text-g-ink-3">Last updated {UPDATED}</p>

      <div className="mt-3 rounded-2xl bg-candy-soft px-4 py-3 text-sm font-bold text-g-ink">
        Your health data is deeply personal. We built MyPMOS to keep it that way: private to you, never sold, and
        yours to delete at any time.
      </div>

      <H>What this covers</H>
      <P>
        This policy explains what MyPMOS collects, how we use and store it, who we share it with, and the choices you
        have. MyPMOS is a wellness companion for people with PMOS (formerly PCOS). It is not a medical service and does not
        diagnose (see our Terms).
      </P>

      <H>What we collect</H>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <LI><b>Account info</b> you give us: email, password (stored encrypted by our auth provider), and an optional display name.</LI>
        <LI><b>Health information you choose to enter</b>: cycle and period data, symptoms, mood, sleep, measurements (weight, blood pressure, etc.), lab results, hair/skin tracking and photos, self-assessments, birth-control history, goals, and notes.</LI>
        <LI><b>Community content</b> you post: text, and any photos or videos you attach.</LI>
        <LI><b>Basic technical data</b> needed to run the app (for example, your push-notification subscription if you turn on reminders).</LI>
      </ul>
      <P>You are always in control of how much you enter. You can use most of the app with very little information.</P>

      <H>Where your data lives</H>
      <P>
        Some data stays only on your device (in your browser). When you create an account and sign in, your data syncs
        to our cloud database and file storage, hosted by Supabase and Vercel on servers in the United States, so it is
        available across your devices.
      </P>

      <H>How we use it</H>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <LI>To run the features you use: tracking, insights, your visit summary, community, and reminders.</LI>
        <LI>To generate your personalized insights and your pre-visit summary.</LI>
        <LI>To keep the service secure and working.</LI>
      </ul>

      <H>AI features and third parties</H>
      <P>
        When you use AI features (like &ldquo;Ask MyPMOS&rdquo; and personalized research), we send your question and a{" "}
        <b>de-identified</b> health context (for example &ldquo;irregular cycles, often logs acne&rdquo;) to Google&apos;s
        Gemini API to generate a response. We do <b>not</b> send your name, email, photos, or lab files to the AI. We
        never use your data to train AI models.
      </P>
      <P>
        We use a small number of service providers to operate MyPMOS (Supabase for database, auth, and storage; Vercel
        for hosting; Google for AI). They process data only to provide their service to us.
      </P>

      <H>What we do NOT do</H>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <LI>We do not sell your personal information.</LI>
        <LI>We do not share your health data with advertisers or data brokers.</LI>
        <LI>We do not post anything or contact your providers on your behalf.</LI>
      </ul>

      <H>Reproductive-health sensitivity</H>
      <P>
        Reproductive and menstrual health data can be especially sensitive. You decide what to enter, you can delete any
        entry at any time, and you can delete your entire account and all associated data whenever you want (see below).
        We encourage you not to post identifying photos in the community.
      </P>

      <H>Your choices and rights</H>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <LI><b>Access &amp; export</b>: you can view your data in the app and export a summary as a PDF.</LI>
        <LI><b>Correct or delete entries</b>: edit or remove anything you have logged.</LI>
        <LI><b>Delete everything</b>: use Account &rarr; Delete my account to permanently erase your account and data.</LI>
        <LI>Depending on where you live (for example the EU/UK or California), you may have additional rights; contact us to exercise them.</LI>
      </ul>

      <H>Data retention</H>
      <P>We keep your data while your account is active. When you delete your account, we delete your data from our systems, and ask our providers to do the same, promptly.</P>

      <H>Children</H>
      <P>
        MyPMOS is not intended for children under 13, and we do not knowingly collect data from them. If you are a
        minor in your region, please use MyPMOS only with a parent or guardian&apos;s permission and involvement.
      </P>

      <H>Security</H>
      <P>
        We use encryption in transit, access controls, and per-user data rules so that only you can read your private
        data. No system is perfectly secure, but we work to protect your information and will notify affected users of a
        material breach as required by law.
      </P>

      <H>Changes</H>
      <P>We may update this policy; we will change the date above and, for significant changes, let you know in the app.</P>

      <H>Contact</H>
      <P>Questions or requests: {CONTACT}.</P>

      <p className="mt-6 rounded-2xl bg-g-lavender-soft px-4 py-3 text-xs font-semibold text-g-ink">
        MyPMOS is currently in early testing. This policy is written in plain language and is being finalized with
        legal review before public launch.
      </p>
    </PatientShell>
  )
}
