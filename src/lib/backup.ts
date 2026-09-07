// Export, import and merge for the progress file. There is no server, so this
// is the only thing that survives a wiped browser or a new machine.

import type { GenSettings, Mode } from '@/engine/questions'
import type { CardState } from '@/engine/srs'
import { todayKey } from './day'

export interface DayRecord {
  answered: number
  correct: number
}

export interface Settings extends GenSettings {
  /** Let a lowercase noun pass. Off by default: capitalisation is grammar here. */
  tolerateCase: boolean
  /** Let ae/oe/ue/ss stand in for the umlauts. On by default: that is a keyboard problem. */
  tolerateAsciiUmlauts: boolean
  sessionLength: number
}

/** The shape held in localStorage and written to an exported file. */
export interface Progress {
  version: number
  cards: Record<string, CardState>
  days: Record<string, DayRecord>
  totals: DayRecord
  settings: Settings
  lastMode: Mode | null
}

export interface Snapshot {
  app: 'deutsch'
  exportedAt: string
  progress: Progress
}

export const SCHEMA = 1

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Drops entries that are not usable cards, and repairs the ones that are. */
export function sanitiseCards(input: unknown): Record<string, CardState> {
  if (!isRecord(input)) return {}
  const out: Record<string, CardState> = {}
  for (const [id, raw] of Object.entries(input)) {
    if (!isRecord(raw)) continue
    out[id] = {
      box: Math.max(0, Math.round(num(raw.box))),
      due: num(raw.due, Date.now()),
      reps: Math.max(0, Math.round(num(raw.reps))),
      lapses: Math.max(0, Math.round(num(raw.lapses))),
      last: num(raw.last),
    }
  }
  return out
}

export function sanitiseDays(input: unknown): Record<string, DayRecord> {
  if (!isRecord(input)) return {}
  const out: Record<string, DayRecord> = {}
  for (const [day, raw] of Object.entries(input)) {
    if (!isRecord(raw)) continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
    out[day] = { answered: Math.max(0, Math.round(num(raw.answered))), correct: Math.max(0, Math.round(num(raw.correct))) }
  }
  return out
}

/**
 * Brings a stored blob up to the current schema. It never discards data on a
 * version it does not recognise: an unknown version is salvaged field by field,
 * because losing a year of reviews is worse than carrying a stale field.
 */
export function migrate(input: unknown, defaults: Progress): Progress {
  if (!isRecord(input)) return defaults
  // Future migrations chain here, e.g. if (data.version === 1) { ...; version = 2 }
  return {
    version: SCHEMA,
    cards: sanitiseCards(input.cards),
    days: sanitiseDays(input.days),
    totals: isRecord(input.totals)
      ? { answered: num(input.totals.answered), correct: num(input.totals.correct) }
      : { answered: 0, correct: 0 },
    settings: { ...defaults.settings, ...(isRecord(input.settings) ? input.settings : {}) },
    lastMode: typeof input.lastMode === 'string' ? (input.lastMode as Mode) : null,
  }
}

export function toSnapshot(progress: Progress): Snapshot {
  return { app: 'deutsch', exportedAt: new Date().toISOString(), progress }
}

/** Reads an exported file. Accepts a bare Progress object too, for hand-edited files. */
export function parseSnapshot(text: string, defaults: Progress): Progress {
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed)) throw new Error('That file does not contain progress data.')
  const body = isRecord(parsed.progress) ? parsed.progress : parsed
  const migrated = migrate(body, defaults)
  if (Object.keys(migrated.cards).length === 0 && Object.keys(migrated.days).length === 0) {
    throw new Error('That file has no cards or history in it.')
  }
  return migrated
}

/**
 * Combines two progress files. Per card the more recent review wins, so a
 * phone and a laptop can be merged in either direction with the same result.
 * Day counts and totals take the larger value rather than the sum, so
 * importing the same file twice cannot inflate your history.
 */
export function mergeProgress(mine: Progress, theirs: Progress): Progress {
  const cards: Record<string, CardState> = { ...mine.cards }
  for (const [id, card] of Object.entries(theirs.cards)) {
    const existing = cards[id]
    if (!existing || card.last > existing.last) cards[id] = card
  }

  const days: Record<string, DayRecord> = { ...mine.days }
  for (const [day, record] of Object.entries(theirs.days)) {
    const existing = days[day]
    days[day] = existing
      ? { answered: Math.max(existing.answered, record.answered), correct: Math.max(existing.correct, record.correct) }
      : record
  }

  return {
    version: SCHEMA,
    cards,
    days,
    totals: {
      answered: Math.max(mine.totals.answered, theirs.totals.answered),
      correct: Math.max(mine.totals.correct, theirs.totals.correct),
    },
    settings: mine.settings,
    lastMode: mine.lastMode ?? theirs.lastMode,
  }
}

export function snapshotFilename(): string {
  return `deutsch-fortschritt-${todayKey()}.json`
}

/** Hands the browser a file to save. */
export function downloadSnapshot(progress: Progress): void {
  const blob = new Blob([JSON.stringify(toSnapshot(progress), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = snapshotFilename()
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
