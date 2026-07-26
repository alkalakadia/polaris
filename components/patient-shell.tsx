"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ClipboardList, BarChart2, Users, BookOpen, Bell, Download } from "lucide-react"
import { cn } from "@/lib/cn"
import { useAuth } from "@/lib/auth"

/** MyPMOS orbit-star mark: a soft 4-point star inside a dashed orbit ring. */
export function GirlyLogo({
  size = 30,
  withWordmark = true,
  tone = "gradient",
}: {
  size?: number
  withWordmark?: boolean
  /** "white" for use on colored/gradient backgrounds where the default gradient would blend in. */
  tone?: "gradient" | "white"
}) {
  const star = tone === "white" ? "white" : "url(#mpg-hdr)"
  const ring = tone === "white" ? "rgba(255,255,255,0.55)" : "url(#mpog-hdr)"
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="MyPMOS">
        {tone === "gradient" && (
          <defs>
            <linearGradient id="mpg-hdr" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#D4789A" />
              <stop offset="55%" stopColor="#B85876" />
              <stop offset="100%" stopColor="#8B72C8" />
            </linearGradient>
            <linearGradient id="mpog-hdr" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4789A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8B72C8" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        )}
        <circle cx="50" cy="50" r="43" stroke={ring} strokeWidth="1.8" strokeDasharray="5 3.5" fill="none" />
        <path
          d={[
            "M50,50 C57,27 63,11 50,4 C37,11 43,27 50,50",
            "M50,50 C73,43 90,38 94,50 C90,62 73,57 50,50",
            "M50,50 C57,73 63,82 50,90 C37,82 43,73 50,50",
            "M50,50 C27,57 10,62 6,50 C10,38 27,43 50,50",
          ].join(" ")}
          fill={star}
        />
        <circle cx="50" cy="50" r="4.5" fill={star} opacity="0.85" />
      </svg>
      {withWordmark && (
        <span className="font-cute text-[1.15rem] font-normal leading-none text-g-ink">MyPMOS</span>
      )}
    </span>
  )
}

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

const NAV: NavItem[] = [
  { href: "/", label: "Today", Icon: Home },
  { href: "/track", label: "Track", Icon: ClipboardList },
  { href: "/insights", label: "Insights", Icon: BarChart2 },
  { href: "/community", label: "Community", Icon: Users },
  { href: "/learn", label: "Learn", Icon: BookOpen },
]

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

/**
 * Shared shell for the patient app: soft rose canvas, an editorial top bar
 * (serif wordmark + Gyno PDF + notifications + profile), and a clean bottom
 * tab bar with line icons. Wrap each patient page in this.
 */
export function PatientShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname()
  const { user, configured } = useAuth()
  const initial = user?.email?.[0]?.toUpperCase()
  const synced = configured && !!user

  return (
    <div className="bg-girly font-round min-h-screen text-g-ink">
      {/* Top bar */}
      <header className="print-hide sticky top-0 z-20 border-b border-g-border bg-g-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-5">
          <Link href="/" aria-label="MyPMOS home">
            <GirlyLogo />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/export"
              className="inline-flex items-center gap-1.5 rounded-full border border-g-border px-3 py-1.5 text-xs font-semibold text-g-ink-2 transition hover:bg-g-pink-soft hover:text-g-pink-deep active:scale-95"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Gyno PDF</span>
            </Link>
            <Link
              href="/community"
              aria-label="Community"
              className="relative grid h-8 w-8 place-items-center rounded-full bg-g-pink-soft text-g-pink-deep transition hover:bg-g-lavender-soft active:scale-95"
            >
              <Bell size={14} />
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              title={synced ? "Synced to your account" : "Sign in to sync"}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition active:scale-95",
                synced ? "bg-g-pink text-white" : "bg-g-canvas-2 text-g-ink-2"
              )}
            >
              {synced ? initial : "☁︎"}
            </Link>
          </div>
        </div>
        {title && (
          <div className="mx-auto max-w-2xl px-5 pb-2">
            <h1 className="font-cute text-lg font-normal text-g-ink">{title}</h1>
          </div>
        )}
      </header>

      {/* Page body */}
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-5">{children}</main>

      {/* Bottom tab bar */}
      <nav className="print-hide fixed inset-x-0 bottom-0 z-30 border-t border-g-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[62px] max-w-md items-center justify-around px-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-0.5 py-1">
                <span
                  className={cn(
                    "grid h-7 w-10 place-items-center rounded-full transition-all",
                    active ? "bg-g-pink-soft" : ""
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2.3 : 1.8} className={active ? "text-g-pink-deep" : "text-g-ink-3"} />
                </span>
                <span className={cn("text-[10px] font-semibold", active ? "text-g-pink-deep" : "text-g-ink-3")}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
