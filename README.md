# MyPMOS

**A patient-first PMOS (formerly PCOS) companion app.** 🌸

Track your cycle, symptoms, labs and photos; see gentle, non-diagnostic insights;
and turn it all into a clean summary for your gyno visit. Built at UW Madison.

Live: **https://mypmos.vercel.app**

---

## What it does

- **Tracker (the moat)** — period/flow, mood, symptoms with severity, sleep, pain,
  skin & hair, cravings, digestion, movement, meds, measurements, notes, photos.
- **Personalized to her goals** — at onboarding she picks up to 3 goals, and the
  Home, Log, Insights and gyno PDF all reshape around them. A "What I track" screen
  lets her pin / hide / reorder anything. Nothing is ever removed; it all flows into
  one Insights.
- **Cycle & period tracking** — learns her real rhythm from logged periods, and
  does NOT guess a next period when cycles are irregular (shows "Learning your
  cycle" until it has enough data).
- **Insights** — patterns from her own data, framed as "worth discussing," never a
  diagnosis.
- **Community, Learn** — real posts/comments (Supabase) and AI-generated,
  research-grounded explainers (Gemini).
- **Gyno visit PDF** — a cute, clinician-first summary that leads with the
  Rotterdam pre-visit picture and her focus, keeping all the detail a doctor wants.
- **Privacy & safety** — private media, consent + age gate, report/block, delete
  account. Reproductive-health data is treated as sensitive by default.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (auth / Postgres / storage / RLS) · Google Gemini · Vercel · PWA (web push)

> ⚠️ Note: this repo pins a modified build of Next.js. Read `AGENTS.md` before
> writing code — some APIs and conventions differ from stock Next.

## Get started

```bash
git clone https://github.com/alkalakadia/polaris.git
cd polaris
npm install

# add your secrets (the file is gitignored — never commit it)
cp .env.example .env.local
#   → fill in Supabase + Gemini values (ask Alka for the shared dev keys)

npm run dev
```

Then open http://localhost:3000.

With no keys it still runs fully on-device (localStorage). Add Supabase + Gemini
to unlock accounts, cross-device sync, Community, and the AI features. See
`.env.example` for exactly what each variable is.

**Database:** run the SQL in `supabase/migrations/` in order (Supabase SQL editor),
or use `scripts/run-migration.mjs`.

## Main routes

`/` Today · `/track` Log · `/track/customize` What I track · `/period` Period ·
`/insights` Insights · `/community` · `/learn` · `/export` Gyno PDF ·
`/labs` · `/hirsutism` Photos · `/account` · `/onboarding`

## Team

- **Alka Lakadia** — engineering lead, product
- Team — using the app daily + contributing on UI / design / user-friendliness

## Disclaimer

MyPMOS is a personal tracking companion, not a medical service. It does not
diagnose or treat. For any health concern, please see a doctor.
