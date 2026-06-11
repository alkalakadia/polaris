# Polaris

**PCOS clinical decision support for OB/GYNs and endocrinologists.**

Built at UW Madison Summer of AI Lab 2026.

---

## What this is

The PCOS workflow tool every OB/GYN should already have:

- **Patient intake** on her phone (5 minutes, mobile-first)
- **Phenotype classification** using Rotterdam 2003/2018 criteria
- **Insulin resistance likelihood** with reasoning
- **Recommended workup** prioritized and cited
- **Personalized patient handout** generated in seconds, matched to phenotype

V1 ships a clickable prototype using three hardcoded sample patients (Sarah, Maya, Aisha) spanning the most common PCOS phenotypes (Types A, C, D). V2 will swap the hardcoded outputs for real AI-driven classification and handout generation.

## Routes

- `/` — landing page
- `/intake` — patient pre-visit intake (5 steps, mobile-first)
- `/intake/complete` — submission confirmation
- `/provider` — provider dashboard (today's PCOS suspects)
- `/provider/[patientId]` — single-patient view (phenotype + workup + reasoning)
- `/provider/[patientId]/handout` — printable personalized patient handout

Try: `/provider/sarah`, `/provider/maya`, `/provider/aisha`.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Vercel hosting

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Status

Early prototype. Built to show real OB/GYNs at UW Health what the workflow looks like before formal user interviews. Not a clinical tool, not for production use.

## Team

- **Alka Lakadia** — engineering lead, product
- TBD — frontend, patient experience
- TBD — clinical content + research (Global Health certificate program)

## Disclaimer

Polaris is a clinical decision support prototype. It does not diagnose or treat. Always apply clinical judgment.
