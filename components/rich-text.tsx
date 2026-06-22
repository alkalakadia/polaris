/**
 * Tiny renderer for the light markdown Gemini returns: **bold**, "## headings",
 * "**Heading**" lines, and "- " bullets. No external deps, safe (text only).
 */

function renderInline(text: string, keyBase: string) {
  // Split on **bold** spans.
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyBase}-${i}`} className="font-bold text-g-ink">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={`${keyBase}-${i}`}>{part}</span>
  })
}

export function RichText({ text }: { text: string }) {
  const lines = text.split("\n")
  const blocks: React.ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="ml-1 list-none space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm font-medium text-g-ink-2">
              <span className="text-g-pink">🌸</span>
              <span>{renderInline(b, `b-${blocks.length}-${i}`)}</span>
            </li>
          ))}
        </ul>
      )
      bullets = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushBullets()
      continue
    }
    // bullet
    if (/^[-*•]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*•]\s+/, ""))
      continue
    }
    flushBullets()
    // "## Heading" or a standalone "**Heading**" line → section heading
    const isHashHeading = /^#{1,4}\s+/.test(line)
    const isBoldHeading = /^\*\*[^*]+\*\*:?$/.test(line)
    if (isHashHeading || isBoldHeading) {
      const heading = line.replace(/^#{1,4}\s+/, "").replace(/^\*\*|\*\*:?$/g, "")
      blocks.push(
        <h3 key={`h-${blocks.length}`} className="mt-4 font-cute text-base font-bold text-g-ink first:mt-0">
          {heading}
        </h3>
      )
      continue
    }
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm font-medium leading-relaxed text-g-ink-2">
        {renderInline(line, `p-${blocks.length}`)}
      </p>
    )
  }
  flushBullets()

  return <div className="space-y-2.5">{blocks}</div>
}
