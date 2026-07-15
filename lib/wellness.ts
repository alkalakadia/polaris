/**
 * Wellness library — calm music, podcasts, and movement for cycle + PMOS.
 *
 * Two kinds of content:
 *  - Curated picks: real, well-known shows / playlists / creators. These open
 *    in Spotify or YouTube (search links always resolve to the live content,
 *    so nothing here goes stale or 404s).
 *  - Your own links: paste any Spotify or YouTube URL and we embed a player
 *    inline. Saved on this device (localStorage).
 *
 * Everything is chosen to be genuinely useful for periods, hormones, mental
 * health, and PMOS — not filler.
 */

export type Category = "calm" | "listen" | "move" | "eat"
export type Provider = "spotify" | "youtube"

export const CATEGORIES: { id: Category; name: string; emoji: string; tagline: string }[] = [
  { id: "calm", name: "Calm", emoji: "🧘‍♀️", tagline: "Meditation & music for cramps, anxiety, and rest" },
  { id: "listen", name: "Listen", emoji: "🎧", tagline: "Podcasts on PMOS, periods, hormones & mental health" },
  { id: "move", name: "Move", emoji: "💪", tagline: "Gentle, PMOS- and period-friendly workouts" },
  { id: "eat", name: "Eat", emoji: "🍓", tagline: "Recipes & ideas for hormones, blood sugar & cravings" },
]

/** Quick, no-recipe food ideas shown at the top of a tab. */
export const QUICK_IDEAS: Partial<Record<Category, string[]>> = {
  eat: [
    "Protein-first breakfast (eggs, Greek yogurt + berries, chia) to steady blood sugar",
    "Start meals with veggies or protein before carbs to soften sugar spikes",
    "Cramp helpers: dark chocolate, pumpkin seeds, almonds (magnesium-rich)",
    "On your period, pair iron + vitamin C: lentils + peppers, spinach + citrus",
    "Add cinnamon to oats or coffee — easy, may support insulin sensitivity",
    "Anti-inflammatory plate: fatty fish, leafy greens, olive oil, berries",
    "Spearmint tea has small PMOS studies behind it — a cozy daily ritual",
  ],
}

export interface Pick {
  title: string
  by?: string
  why: string
  provider: Provider
  /** Search query that resolves to the live show/playlist/creator. */
  q: string
}

/** Build a link that opens the content in Spotify or YouTube. */
export function openUrl(p: Pick): string {
  return p.provider === "spotify"
    ? `https://open.spotify.com/search/${encodeURIComponent(p.q)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(p.q)}`
}

// ---- Curated picks ---------------------------------------------------------

const CALM: Pick[] = [
  { title: "Peaceful Piano", why: "Soft piano for anxious days and winding down", provider: "spotify", q: "Peaceful Piano playlist" },
  { title: "Lo-Fi Beats", why: "Gentle background while you rest or curl up with a heat pad", provider: "spotify", q: "Lo-Fi Beats chill playlist" },
  { title: "Deep Sleep", why: "Slow your mind on heavy, achy nights", provider: "spotify", q: "Deep Sleep ambient playlist" },
  { title: "Stress Relief", why: "Steady your breathing when it's all a lot", provider: "spotify", q: "Stress Relief calm playlist" },
  { title: "Rain & Nature Sounds", why: "White noise that eases cramps and overwhelm", provider: "spotify", q: "Rain sounds nature white noise" },
  { title: "Meditation & Mindfulness", why: "Guided calm for anxious moments", provider: "spotify", q: "Guided meditation mindfulness" },
  { title: "Yoga & Meditation", why: "Breathe and stretch the tension out", provider: "spotify", q: "Yoga and meditation music" },
  { title: "Self-Care Sunday", why: "A soft reset playlist for low-energy days", provider: "spotify", q: "Self care soft pop playlist" },
]

const LISTEN: Pick[] = [
  // PMOS + hormones
  { title: "The PCOS Nutritionist Podcast", by: "Clare Goodwin", why: "Food-first PMOS science, no fad diets", provider: "spotify", q: "The PCOS Nutritionist Podcast Clare Goodwin" },
  { title: "PCOS Repair Podcast", by: "Ashlene Korcek", why: "Root-cause PMOS, symptom by symptom", provider: "spotify", q: "PCOS Repair Podcast" },
  { title: "A Cyster & Her Mister", by: "Tallene & Sirak", why: "Real-life PMOS, warm and relatable", provider: "spotify", q: "A Cyster and Her Mister PCOS podcast" },
  { title: "Are You Menstrual?", by: "Amanda Montalvo", why: "Cycle & hormone health from a women's-health dietitian", provider: "spotify", q: "Are You Menstrual podcast Amanda Montalvo" },
  { title: "Period Story", by: "Le'Nise Brothers", why: "Honest conversations about periods and hormones", provider: "spotify", q: "Period Story podcast Le'Nise Brothers" },
  // Mental health
  { title: "Therapy for Black Girls", by: "Dr. Joy Harden Bradford", why: "Accessible mental-wellness talk", provider: "spotify", q: "Therapy for Black Girls podcast" },
  { title: "Feel Better, Live More", by: "Dr. Rangan Chatterjee", why: "Doctor-led wellbeing, calm and practical", provider: "spotify", q: "Feel Better Live More podcast" },
  { title: "The Hardcore Self Help Podcast", by: "Dr. Robert Duff", why: "Anxiety & depression in plain language", provider: "spotify", q: "Hardcore Self Help Podcast Duff" },
  // Motivation + self-help
  { title: "The Mel Robbins Podcast", why: "Practical motivation and tools you can use today", provider: "spotify", q: "The Mel Robbins Podcast" },
  { title: "On Purpose", by: "Jay Shetty", why: "Reflective, calming self-help", provider: "spotify", q: "On Purpose with Jay Shetty" },
  { title: "Happier", by: "Gretchen Rubin", why: "Tiny habits for a happier you", provider: "spotify", q: "Happier with Gretchen Rubin" },
]

const MOVE: Pick[] = [
  { title: "Yoga for Cramps & Period Pain", by: "Yoga with Adriene", why: "Gentle flow for cramp relief, no equipment", provider: "youtube", q: "Yoga with Adriene yoga for cramps period" },
  { title: "Low-Impact Walking Workout", by: "Grow with Jo", why: "Get moving indoors on low-energy days", provider: "youtube", q: "Grow with Jo low impact walking workout indoor" },
  { title: "PMOS Home Workout (No Equipment)", why: "Beginner-friendly, insulin-supportive movement", provider: "youtube", q: "PCOS workout at home no equipment beginner" },
  { title: "Pilates for Beginners", by: "Move with Nicole", why: "Low-impact core and calm", provider: "youtube", q: "Move with Nicole pilates for beginners" },
  { title: "Gentle Stretch for Period Pain", why: "10 minutes of relief, do it in bed", provider: "youtube", q: "gentle stretch for period pain 10 minutes" },
  { title: "PMOS Strength Training", why: "Build muscle to help balance blood sugar", provider: "youtube", q: "PCOS strength training insulin resistance" },
  { title: "Cozy Low-Impact Cardio", why: "Easy, steady movement that feels good", provider: "youtube", q: "cozy cardio low impact at home" },
  { title: "Bedtime Yoga to Relax", by: "Yoga with Adriene", why: "Unwind and sleep better", provider: "youtube", q: "Yoga with Adriene bedtime yoga relax" },
]

const EAT: Pick[] = [
  { title: "Blood-Sugar-Friendly Meals", by: "Glucose Goddess", why: "Simple food order & swaps to flatten sugar spikes", provider: "youtube", q: "Glucose Goddess blood sugar friendly meals" },
  { title: "Balanced Everyday Recipes", by: "Pick Up Limes", why: "Wholesome, veggie-forward meals that fill you up", provider: "youtube", q: "Pick Up Limes healthy balanced meals" },
  { title: "Whole-Food Recipes", by: "Downshiftology", why: "Real-food breakfasts, bowls & dinners, easy to follow", provider: "youtube", q: "Downshiftology healthy whole food recipes" },
  { title: "PMOS-Friendly Recipes", by: "A Cyster & Her Mister", why: "Made for PMOS — gluten- & dairy-light comfort food", provider: "youtube", q: "A Cyster and Her Mister PCOS recipes" },
  { title: "High-Protein PMOS Breakfast", why: "Beat the mid-morning crash and cravings", provider: "youtube", q: "high protein PCOS breakfast recipes" },
  { title: "Anti-Inflammatory Dinners", why: "Cozy meals that are kind to your hormones", provider: "youtube", q: "anti inflammatory dinner recipes easy" },
  { title: "Iron-Rich Meals for Your Period", why: "Refuel iron on heavy days", provider: "youtube", q: "iron rich recipes meals for periods" },
  { title: "Balanced Snacks & Energy Bites", why: "Protein + fiber snacks for steady energy", provider: "youtube", q: "high protein healthy snack ideas energy bites" },
]

export const CURATED: Record<Category, Pick[]> = { calm: CALM, listen: LISTEN, move: MOVE, eat: EAT }

// ---- Featured (plays embedded in-app) --------------------------------------
// Real, verified links so the inline players actually load. These rotate daily
// and on Refresh, so the section never feels static.

export interface Featured {
  title: string
  by?: string
  url: string
}

export const FEATURED: Record<Category, Featured[]> = {
  calm: [
    { title: "Peaceful Piano", by: "soft piano to slow down", url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO" },
    { title: "Peaceful Meditation", by: "calm for anxious moments", url: "https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u" },
    { title: "Calming Nature Music", by: "rain & soft nature sounds", url: "https://open.spotify.com/playlist/37i9dQZF1DX1KVBf2zZZ2X" },
  ],
  listen: [
    { title: "The PCOS Podcast", by: "A Cyster & Her Mister", url: "https://open.spotify.com/show/6AV1Y9h6gUI15v7wQFnhDg" },
    { title: "The Mel Robbins Podcast", by: "motivation & real tools", url: "https://open.spotify.com/show/7vz4RYsD5MulTCrcH478t1" },
  ],
  move: [
    { title: "Yoga for Cramps & PMS", by: "Yoga With Adriene", url: "https://www.youtube.com/watch?v=4JaCcp39iVI" },
    { title: "30-Min Morning Pilates", by: "Move With Nicole", url: "https://www.youtube.com/watch?v=LbG1ovCGp-E" },
  ],
  eat: [
    { title: "What I Eat in a Day", by: "Glucose Goddess", url: "https://www.youtube.com/watch?v=vp9TLTIQLmg" },
    { title: "Eat Your Food in This Order", by: "Glucose Goddess", url: "https://www.youtube.com/watch?v=CnqZEQv2MaQ" },
    { title: "One-Pot High-Protein PMOS Meal", url: "https://www.youtube.com/watch?v=vuMSAXz-PlE" },
  ],
}

// ---- Daily rotation + refresh ----------------------------------------------
// Everything below rotates by (day-of-epoch + a refresh seed), so the picks
// reshuffle once a day on their own and instantly when you tap Refresh.

function dayIndex(): number {
  return Math.floor(Date.now() / 86_400_000)
}

function rotate<T>(arr: T[], by: number): T[] {
  if (arr.length <= 1) return arr.slice()
  const n = (((by % arr.length) + arr.length) % arr.length)
  return [...arr.slice(n), ...arr.slice(0, n)]
}

/** The featured (embedded) pick for a category, rotated daily + by seed. */
export function featuredFor(category: Category, seed: number): Featured | null {
  const pool = FEATURED[category]
  if (!pool.length) return null
  const i = (((dayIndex() + seed) % pool.length) + pool.length) % pool.length
  return pool[i]
}

/** Curated picks for a category, reordered daily + by seed. */
export function picksFor(category: Category, seed: number): Pick[] {
  return rotate(CURATED[category], dayIndex() + seed)
}

/** Quick ideas for a category (if any), reordered daily + by seed. */
export function ideasFor(category: Category, seed: number): string[] {
  const arr = QUICK_IDEAS[category]
  return arr ? rotate(arr, dayIndex() + seed) : []
}

// ---- Embeds ----------------------------------------------------------------

export interface Embed {
  provider: Provider
  embedUrl: string
  /** Spotify: full-height player (playlists/shows) vs compact (track/episode). */
  tall: boolean
}

/** Turn a pasted Spotify/YouTube link into an embeddable player URL. */
export function embedFromUrl(raw: string): Embed | null {
  const url = (raw || "").trim()
  if (!url) return null

  // Spotify: open.spotify.com/<type>/<id>  or  spotify:<type>:<id>
  let m =
    url.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track|show|episode|artist)\/([A-Za-z0-9]+)/i) ||
    url.match(/spotify:(playlist|album|track|show|episode|artist):([A-Za-z0-9]+)/i)
  if (m) {
    const type = m[1].toLowerCase()
    const tall = type === "playlist" || type === "show" || type === "album" || type === "artist"
    return { provider: "spotify", embedUrl: `https://open.spotify.com/embed/${type}/${m[2]}`, tall }
  }

  // YouTube playlist
  if (/youtube\.com|youtu\.be/.test(url)) {
    const list = url.match(/[?&]list=([A-Za-z0-9_-]+)/)
    if (list) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/videoseries?list=${list[1]}`, tall: true }
  }
  // YouTube video / short
  const v = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  if (v) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${v[1]}`, tall: true }

  return null
}

// ---- Your saved links (this device) ---------------------------------------

export interface UserLink {
  id: string
  title: string
  category: Category
  url: string
}

const KEY = "polaris.wellness.links.v1"

export function getUserLinks(): UserLink[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as UserLink[]) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function save(links: UserLink[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(links))
  } catch {
    /* ignore quota errors */
  }
}

export function addUserLink(input: { title: string; url: string; category: Category }): { link?: UserLink; error?: string } {
  const url = input.url.trim()
  if (!embedFromUrl(url)) {
    return { error: "Paste a Spotify or YouTube link (playlist, podcast, or video)." }
  }
  const link: UserLink = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title.trim() || "My link",
    category: input.category,
    url,
  }
  const all = [link, ...getUserLinks()]
  save(all)
  return { link }
}

export function removeUserLink(id: string): UserLink[] {
  const next = getUserLinks().filter((l) => l.id !== id)
  save(next)
  return next
}
