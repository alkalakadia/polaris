import Link from "next/link"
import { PolarisLogo } from "@/components/logo"

export default function IntakeCompletePage() {
  return (
    <main className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="border-b border-border-soft bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center px-5 py-4">
          <Link href="/">
            <PolarisLogo size={26} withWordmark wordmarkClassName="text-base" />
          </Link>
        </div>
      </header>

      <section className="bg-hero mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <div className="bg-brand-gradient flex h-20 w-20 items-center justify-center rounded-full shadow-pop">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-10 w-10 text-white"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display mt-8 text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
          You're all set.
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-2">
          Your provider has your answers and a head start on your case. The visit can focus on what
          matters most to you.
        </p>

        <div className="mt-12 flex flex-col gap-3 text-sm sm:flex-row">
          <Link
            href="/"
            className="rounded-full border border-border-strong bg-card px-6 py-3 font-medium text-ink shadow-soft transition hover:bg-canvas-tint"
          >
            Back to home
          </Link>
          <Link
            href="/provider"
            className="rounded-full bg-ink px-6 py-3 font-medium text-canvas shadow-pop transition hover:bg-plum"
          >
            Preview provider view
          </Link>
        </div>

        <p className="mt-16 max-w-md text-xs leading-relaxed text-ink-3">
          Polaris is a clinical decision support prototype. It does not diagnose or treat. Always
          apply clinical judgment.
        </p>
      </section>
    </main>
  )
}
