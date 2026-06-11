/**
 * Polaris logo.
 *
 * Design rationale:
 *  - Polaris = the North Star. The mark is a four-point star with an
 *    elongated north arm to read as "guiding star" at a glance.
 *  - The surrounding ring is the menstrual cycle / orbital arc — a
 *    quiet nod to the condition area without being literal.
 *  - Coral → plum gradient matches the brand system. Warm, sophisticated,
 *    not pink-bubblegum.
 *  - Optical balance: the star sits slightly above center so the ring
 *    breathes underneath.
 *
 * Props:
 *  - size: rendered px (default 40)
 *  - withWordmark: if true, renders "polaris" next to the mark
 *  - className: extra classes for the outer span
 */

import { cn } from "@/lib/cn"

interface LogoProps {
  size?: number
  withWordmark?: boolean
  className?: string
  wordmarkClassName?: string
}

export function PolarisLogo({
  size = 40,
  withWordmark = false,
  className,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Polaris"
      >
        <defs>
          <linearGradient id="polaris-gradient" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#F4A988" />
            <stop offset="40%" stopColor="#E15A78" />
            <stop offset="100%" stopColor="#5B3A52" />
          </linearGradient>
          <linearGradient id="polaris-ring" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#E15A78" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#5B3A52" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Orbital ring — open at the top so the star peeks above */}
        <circle
          cx="24"
          cy="25"
          r="18"
          stroke="url(#polaris-ring)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="2 4"
          strokeLinecap="round"
        />

        {/* North star — four-point with elongated vertical arm */}
        <path
          d="M24 4 L26 21 L43 24 L26 27 L24 44 L22 27 L5 24 L22 21 Z"
          fill="url(#polaris-gradient)"
        />

        {/* Inner highlight — the bright core */}
        <circle cx="24" cy="24" r="3" fill="white" fillOpacity="0.9" />
      </svg>

      {withWordmark && (
        <span
          className={cn(
            "font-display text-[1.35rem] font-medium tracking-tight text-ink",
            wordmarkClassName
          )}
        >
          polaris
        </span>
      )}
    </span>
  )
}
