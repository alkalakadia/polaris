"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"

/** Cute candy-gradient star wordmark for the patient app. */
export function GirlyLogo({ size = 30 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Polaris">
        <defs>
          <linearGradient id="g-star" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#FF8FB8" />
            <stop offset="55%" stopColor="#FF6FA5" />
            <stop offset="100%" stopColor="#B79CED" />
          </linearGradient>
        </defs>
        <path d="M24 4 L26.5 21.5 L44 24 L26.5 26.5 L24 44 L21.5 26.5 L4 24 L21.5 21.5 Z" fill="url(#g-star)" />
        <circle cx="24" cy="24" r="3" fill="white" fillOpacity="0.95" />
      </svg>
      <span className="font-cute text-[1.45rem] font-bold leading-none text-candy">polaris</span>
    </span>
  )
}

/** Top-bar account chip: shows sync state and links to /account. */
function AccountButton() {
  const { user, configured, loading } = useAuth()
  const synced = configured && !!user
  const initial = user?.email?.[0]?.toUpperCase() ?? "🌸"
  return (
    <Link
      href="/account"
      aria-label="Account"
      title={synced ? "Synced to your account" : "Sign in to sync"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full text-sm font-bold shadow-girly transition active:scale-95",
        synced ? "bg-candy text-white" : "bg-white text-g-pink-deep"
      )}
    >
      {loading ? "…" : synced ? initial : "☁︎"}
    </Link>
  )
}

interface NavItem {
  href: string
  label: string
  emoji: string
}

const NAV: NavItem[] = [
  { href: "/", label: "Today", emoji: "🌸" },
  { href: "/track", label: "Track", emoji: "📝" },
  { href: "/insights", label: "Insights", emoji: "✨" },
  { href: "/community", label: "Community", emoji: "💬" },
  { href: "/learn", label: "Learn", emoji: "📚" },
]

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

/**
 * Shared shell for the patient app: dreamy pastel background, a soft top bar,
 * and a cute floating bottom tab bar. Wrap each patient page in this.
 */
export function PatientShell({
  children,
  title,
}: {
  children: React.ReactNode
  title?: string
}) {
  const pathname = usePathname()

  return (
    <div className="bg-girly font-round min-h-screen text-g-ink">
      {/* Top bar */}
      <header className="print-hide sticky top-0 z-20 border-b border-g-border/70 bg-g-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" aria-label="Polaris home">
            <GirlyLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/export"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-g-pink-deep shadow-girly transition active:scale-95"
            >
              <span>📄</span>
              <span className="hidden sm:inline">Gyno PDF</span>
            </Link>
            <AccountButton />
          </div>
        </div>
        {title && (
          <div className="mx-auto max-w-2xl px-5 pb-2">
            <h1 className="font-cute text-lg font-bold text-g-ink">{title}</h1>
          </div>
        )}
      </header>

      {/* Page body — bottom padding leaves room for the floating tab bar */}
      <main className="mx-auto max-w-2xl px-5 pb-32 pt-5">{children}</main>

      {/* Floating bottom tab bar */}
      <nav className="print-hide fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-[2rem] border border-g-border bg-white/90 px-2 py-2 shadow-girly-pop backdrop-blur-md">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-3xl px-1 py-2 text-[0.65rem] font-bold transition",
                  active ? "bg-candy-soft text-g-pink-deep" : "text-g-ink-3 active:scale-95"
                )}
              >
                <span className={cn("text-xl leading-none", active && "animate-pop")}>{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
