/**
 * Tiny className concatenation helper. No external deps.
 *
 * Replaces clsx/classnames for this prototype's scale. Filters out
 * falsy values so conditional classes stay clean at the call site.
 */
export function cn(...args: Array<string | undefined | false | null>): string {
  return args.filter(Boolean).join(" ")
}
