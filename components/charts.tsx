/**
 * Small, print-friendly inline charts shared by /insights and /export (the
 * gyno visit PDF). No charting library — these are static SVG/HTML so they
 * render identically on screen and in the browser's print/PDF output.
 *
 * Each chart is a single series (one accent color), so none of them need a
 * legend — the section heading around them already says what's plotted.
 */

export interface FrequencyItem {
  key: string
  emoji?: string
  label: string
  count: number
}

/** Horizontal bars for "how often" comparisons (top symptoms, top moods, …). */
export function FrequencyBars({ items, accent = "#9F4763" }: { items: FrequencyItem[]; accent?: string }) {
  if (items.length === 0) return null
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.key}>
          <div className="flex items-center justify-between gap-2 text-sm font-bold text-g-ink">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              {it.emoji && <span aria-hidden>{it.emoji}</span>}
              <span className="truncate">{it.label}</span>
            </span>
            <span className="shrink-0 text-xs font-bold text-g-ink-3">{it.count}×</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-g-border-2">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((it.count / max) * 100, 8)}%`, background: accent }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export interface CycleLengthPoint {
  length: number
  startDate: string // "YYYY-MM-DD" — the cycle's own start date
}

/** Small column chart of recent cycle lengths, labeled by month, with a dashed average line. */
export function CycleLengthChart({
  points,
  average,
  accent = "#B85876",
}: {
  points: CycleLengthPoint[]
  average?: number | null
  accent?: string
}) {
  const recent = points.slice(-8)
  if (recent.length === 0) return null
  const barH = 52
  const max = Math.max(...recent.map((p) => p.length), average ?? 0) * 1.08
  const avgBottom = average != null ? (average / max) * barH : null
  const years = new Set(recent.map((p) => new Date(p.startDate + "T00:00:00").getFullYear()))
  const monthLabel = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: years.size > 1 ? "2-digit" : undefined })

  return (
    <div>
      <div className="relative flex items-end gap-1.5" style={{ height: barH + 16 }}>
        {avgBottom != null && (
          <div
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-g-ink-3/50"
            style={{ bottom: avgBottom }}
          />
        )}
        {recent.map((p, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[0.6rem] font-bold text-g-ink-3">{p.length}</span>
            <div
              className="w-full max-w-[22px] rounded-t-md"
              style={{ height: Math.max((p.length / max) * barH, 4), background: accent }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {recent.map((p, i) => (
          <span key={i} className="flex-1 text-center text-[0.55rem] font-bold text-g-ink-3">
            {monthLabel(p.startDate)}
          </span>
        ))}
      </div>
      {average != null && (
        <p className="mt-1.5 text-[0.65rem] font-semibold text-g-ink-3">
          Dashed line = your average ({average} days).
        </p>
      )}
    </div>
  )
}

export interface SeriesPoint {
  label: string
  value: number
}

/** Compact trend line (e.g. weight by month) with a start→end readout. */
export function TrendSparkline({
  points,
  unit = "",
  decimals = 1,
  accent = "#7B68C8",
  goodDirection,
}: {
  points: SeriesPoint[]
  unit?: string
  decimals?: number
  accent?: string
  /** If set, colors the delta green/amber when it matches/opposes the desired direction. */
  goodDirection?: "up" | "down"
}) {
  if (points.length < 2) return null
  const w = 280
  const h = 52
  const pad = 6
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = (w - pad * 2) / (points.length - 1)
  const xy = (i: number) => {
    const x = pad + i * stepX
    const y = pad + (1 - (points[i].value - min) / span) * (h - pad * 2)
    return [x, y] as const
  }
  const path = points.map((_, i) => xy(i)).map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [x0, y0] = xy(0)
  const [xN, yN] = xy(points.length - 1)
  const areaPath = `${path} L${xN.toFixed(1)},${(h - pad).toFixed(1)} L${x0.toFixed(1)},${(h - pad).toFixed(1)} Z`

  const first = points[0].value
  const last = points[points.length - 1].value
  const delta = last - first
  const deltaGood = goodDirection ? (goodDirection === "down" ? delta <= 0 : delta >= 0) : null
  const deltaColor = deltaGood == null ? "#7A5568" : deltaGood ? "#4E8C6E" : "#B85876"

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-cute text-xl font-bold text-g-ink">
          {last.toFixed(decimals)}
          {unit}
        </p>
        <p className="text-[0.65rem] font-bold" style={{ color: deltaColor }}>
          {delta === 0 ? "steady" : `${delta > 0 ? "+" : ""}${delta.toFixed(decimals)}${unit}`} since {points[0].label}
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 w-full" preserveAspectRatio="none" role="img" aria-label={`Trend from ${first.toFixed(decimals)}${unit} to ${last.toFixed(decimals)}${unit}`}>
        <path d={areaPath} fill={accent} opacity={0.12} stroke="none" />
        <path d={path} fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x0} cy={y0} r={4} fill={accent} stroke="white" strokeWidth={2} />
        <circle cx={xN} cy={yN} r={4} fill={accent} stroke="white" strokeWidth={2} />
      </svg>
    </div>
  )
}
