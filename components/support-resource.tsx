/**
 * Shown when a user flags a sensitive item (self-harm, disordered eating).
 * These are never just a silent checkbox — we respond with warmth + real help.
 */
export function SupportResource() {
  return (
    <div className="rounded-3xl border-2 border-g-pink bg-white p-4 shadow-girly">
      <p className="font-cute text-base font-bold text-g-ink">💗 You deserve support</p>
      <p className="mt-1 text-sm font-medium text-g-ink-2">
        Some of what you shared can feel heavy, and you don&apos;t have to carry it alone. If
        you&apos;re in the US you can call or text <strong>988</strong> (Suicide &amp; Crisis
        Lifeline) any time, or text <strong>&quot;NEDA&quot; to 741741</strong> for support around
        eating concerns. If you&apos;re ever in immediate danger, please call your local emergency
        number.
      </p>
      <p className="mt-2 text-xs font-semibold text-g-ink-3">
        Reaching out to someone you trust or a professional is a brave, kind thing to do for
        yourself. 💗
      </p>
    </div>
  )
}
