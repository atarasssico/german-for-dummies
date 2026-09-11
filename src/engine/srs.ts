// Leitner scheduling. Boxes rather than SM-2 intervals: this is a drill app
// where a session is a handful of minutes, so what matters is that items you
// get wrong come back inside the same session and items you know go quiet.

export interface CardState {
  box: number
  /** Epoch millis at which the card should next be shown. */
  due: number
  reps: number
  lapses: number
  last: number
}

/** Days until the next review for a card in each box. Box 0 comes back today. */
export const BOX_INTERVALS = [0, 1, 2, 4, 8, 16, 32]

export const MAX_BOX = BOX_INTERVALS.length - 1

const DAY = 24 * 60 * 60 * 1000

export function newCard(now = Date.now()): CardState {
  return { box: 0, due: now, reps: 0, lapses: 0, last: 0 }
}

export function review(state: CardState | undefined, correct: boolean, now = Date.now()): CardState {
  const card = state ?? newCard(now)
  const box = correct ? Math.min(card.box + 1, MAX_BOX) : 0
  return {
    box,
    due: now + (BOX_INTERVALS[box] ?? 0) * DAY,
    reps: card.reps + 1,
    lapses: card.lapses + (correct ? 0 : 1),
    last: now,
  }
}

export function isDue(state: CardState | undefined, now = Date.now()): boolean {
  return !state || state.due <= now
}

/** 0 for a card never answered right, up to 1 for one parked in the last box. */
export function strength(state: CardState | undefined): number {
  if (!state) return 0
  return state.box / MAX_BOX
}

export interface PickOptions {
  /** Every item the current settings allow, commonest first. */
  pool: string[]
  states: Record<string, CardState | undefined>
  count: number
  now?: number
}

/**
 * Builds one session: everything overdue first (most overdue first), then
 * unseen items, then whatever is closest to falling due. Weak cards are
 * favoured over strong ones so a session is not padded with things you know.
 */
export function pickSession({ pool, states, count, now = Date.now() }: PickOptions): string[] {
  const due: string[] = []
  const fresh: string[] = []
  const rest: string[] = []

  for (const id of pool) {
    const state = states[id]
    if (!state) fresh.push(id)
    else if (state.due <= now) due.push(id)
    else rest.push(id)
  }

  due.sort((a, b) => (states[a]?.due ?? 0) - (states[b]?.due ?? 0))
  rest.sort((a, b) => (states[a]?.due ?? 0) - (states[b]?.due ?? 0))
  // Unseen cards keep pool order, which is commonest first. Shuffling them
  // introduced rare words as readily as everyday ones.

  return [...due, ...fresh, ...rest].slice(0, count)
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const a = items[i] as T
    const b = items[j] as T
    items[i] = b
    items[j] = a
  }
  return items
}

export { shuffle }

export interface DeckSummary {
  total: number
  /** Cards answered at least once. Moves on your very first answer. */
  seen: number
  due: number
  /** Cards parked in the last box, which takes six correct reviews. */
  mastered: number
  /** Cards at box 4 or better, roughly "this one has stuck". */
  known: number
  /**
   * Mean strength across the whole pool, counting unseen items as zero. Honest
   * but too coarse to show: with a 1,420 card deck one answer moves it by
   * 0.01%, so a whole session still rounds to 0%. Use seen and known for
   * anything a person reads.
   */
  progress: number
  /** Mean strength among the cards you have actually started. */
  strengthOfSeen: number
}

/** Box 4 means an eight day interval, which is where a card starts feeling learned. */
const KNOWN_BOX = 4

export function summarise(pool: string[], states: Record<string, CardState | undefined>, now = Date.now()): DeckSummary {
  let seen = 0
  let due = 0
  let mastered = 0
  let known = 0
  let total = 0
  for (const id of pool) {
    const state = states[id]
    if (state) {
      seen++
      if (state.due <= now) due++
      if (state.box >= MAX_BOX) mastered++
      if (state.box >= KNOWN_BOX) known++
      total += strength(state)
    } else {
      due++
    }
  }
  return {
    total: pool.length,
    seen,
    due,
    mastered,
    known,
    progress: pool.length ? total / pool.length : 0,
    strengthOfSeen: seen ? total / seen : 0,
  }
}

/**
 * How many cards sit in each Leitner box, index 0 first. Unseen cards are not
 * counted: they have not entered the box yet.
 */
export function boxHistogram(pool: string[], states: Record<string, CardState | undefined>): number[] {
  const counts = new Array<number>(MAX_BOX + 1).fill(0)
  for (const id of pool) {
    const state = states[id]
    if (!state) continue
    counts[state.box] = (counts[state.box] ?? 0) + 1
  }
  return counts
}
