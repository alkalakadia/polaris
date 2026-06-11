import Link from "next/link"

export default function IntakeCompletePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-2xl items-center px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-teal-400" />
            <span className="text-sm font-semibold tracking-tight">Polaris</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8 text-white"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-semibold leading-tight">Thanks. Your provider has your information.</h1>
        <p className="mt-3 max-w-lg text-base text-slate-600">
          Your responses will be on your provider's screen when she walks in. She has a head start on your case so the
          visit can focus on what matters to you.
        </p>

        <div className="mt-10 flex flex-col gap-3 text-sm sm:flex-row">
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-900 hover:bg-slate-50"
          >
            Back to home
          </Link>
          <Link
            href="/provider"
            className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
          >
            Preview provider view (demo)
          </Link>
        </div>

        <p className="mt-10 max-w-md text-xs text-slate-400">
          This is a clinical decision support prototype. It does not diagnose or treat. Always apply
          clinical judgment.
        </p>
      </section>
    </main>
  )
}
