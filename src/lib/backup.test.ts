import { describe, expect, it } from 'vitest'
import { DEFAULT_PROGRESS } from '@/store/progress'
import type { Progress } from './backup'
import { mergeProgress, migrate, parseSnapshot, sanitiseCards, toSnapshot } from './backup'

const card = (over: Partial<Progress['cards'][string]> = {}) => ({
  box: 2, due: 1_700_000_000_000, reps: 3, lapses: 1, last: 1_690_000_000_000, ...over,
})

function progress(over: Partial<Progress> = {}): Progress {
  return { ...DEFAULT_PROGRESS, ...over }
}

describe('migrate', () => {
  it('keeps data from an unrecognised future version instead of discarding it', () => {
    const stored = {
      version: 99,
      cards: { 'decl:kind:dat': card() },
      days: { '2026-09-07': { answered: 4, correct: 3 } },
      totals: { answered: 40, correct: 31 },
    }
    const out = migrate(stored, DEFAULT_PROGRESS)
    expect(Object.keys(out.cards)).toEqual(['decl:kind:dat'])
    expect(out.days['2026-09-07']).toEqual({ answered: 4, correct: 3 })
    expect(out.totals).toEqual({ answered: 40, correct: 31 })
    expect(out.version).toBe(1)
  })

  it('fills in fields a stored blob is missing', () => {
    const out = migrate({ cards: { a: card() } }, DEFAULT_PROGRESS)
    expect(out.totals).toEqual({ answered: 0, correct: 0 })
    expect(out.days).toEqual({})
    expect(out.settings.sessionLength).toBe(DEFAULT_PROGRESS.settings.sessionLength)
  })

  it('keeps stored settings but backfills new ones', () => {
    const out = migrate({ settings: { sessionLength: 30 } }, DEFAULT_PROGRESS)
    expect(out.settings.sessionLength).toBe(30)
    expect(out.settings.tolerateAsciiUmlauts).toBe(true)
  })

  it('returns the defaults for junk', () => {
    expect(migrate(null, DEFAULT_PROGRESS).cards).toEqual({})
    expect(migrate('nope', DEFAULT_PROGRESS).cards).toEqual({})
  })
})

describe('sanitiseCards', () => {
  it('repairs partial cards rather than dropping them', () => {
    const out = sanitiseCards({ a: { box: 2.6, reps: -1 } })
    expect(out.a?.box).toBe(3)
    expect(out.a?.reps).toBe(0)
    expect(typeof out.a?.due).toBe('number')
  })

  it('drops entries that are not objects', () => {
    expect(sanitiseCards({ a: 'x', b: null, c: card() })).toEqual({ c: card() })
  })
})

describe('parseSnapshot', () => {
  it('round-trips an export', () => {
    const original = progress({ cards: { 'gender:kind': card() }, totals: { answered: 9, correct: 7 } })
    const text = JSON.stringify(toSnapshot(original))
    const back = parseSnapshot(text, DEFAULT_PROGRESS)
    expect(back.cards['gender:kind']).toEqual(card())
    expect(back.totals).toEqual({ answered: 9, correct: 7 })
  })

  it('accepts a bare progress object as well as a wrapped snapshot', () => {
    const text = JSON.stringify(progress({ cards: { a: card() } }))
    expect(Object.keys(parseSnapshot(text, DEFAULT_PROGRESS).cards)).toEqual(['a'])
  })

  it('rejects a file with nothing in it', () => {
    expect(() => parseSnapshot('{"app":"deutsch","progress":{}}', DEFAULT_PROGRESS)).toThrow(/no cards/)
  })

  it('rejects text that is not JSON', () => {
    expect(() => parseSnapshot('not json', DEFAULT_PROGRESS)).toThrow()
  })
})

describe('mergeProgress', () => {
  it('keeps the more recent review for each card', () => {
    const mine = progress({ cards: { a: card({ box: 1, last: 100 }), b: card({ box: 4, last: 500 }) } })
    const theirs = progress({ cards: { a: card({ box: 5, last: 900 }), c: card({ box: 2, last: 300 }) } })
    const out = mergeProgress(mine, theirs)
    expect(out.cards.a?.box).toBe(5)
    expect(out.cards.b?.box).toBe(4)
    expect(out.cards.c?.box).toBe(2)
  })

  it('gives the same result in either direction', () => {
    const mine = progress({ cards: { a: card({ box: 1, last: 100 }), b: card({ box: 4, last: 500 }) } })
    const theirs = progress({ cards: { a: card({ box: 5, last: 900 }), c: card({ box: 2, last: 300 }) } })
    expect(mergeProgress(mine, theirs).cards).toEqual(mergeProgress(theirs, mine).cards)
  })

  it('never double counts a day when the same file is imported twice', () => {
    const mine = progress({
      days: { '2026-09-07': { answered: 10, correct: 8 } },
      totals: { answered: 10, correct: 8 },
    })
    const once = mergeProgress(mine, mine)
    const twice = mergeProgress(once, mine)
    expect(once.days['2026-09-07']).toEqual({ answered: 10, correct: 8 })
    expect(twice.totals).toEqual({ answered: 10, correct: 8 })
  })

  it('takes the larger count when two devices logged the same day', () => {
    const mine = progress({ days: { '2026-09-07': { answered: 10, correct: 8 } } })
    const theirs = progress({ days: { '2026-09-07': { answered: 4, correct: 4 }, '2026-09-06': { answered: 7, correct: 5 } } })
    const out = mergeProgress(mine, theirs)
    expect(out.days['2026-09-07']).toEqual({ answered: 10, correct: 8 })
    expect(out.days['2026-09-06']).toEqual({ answered: 7, correct: 5 })
  })

  it('loses nothing when merging into an empty box', () => {
    const theirs = progress({ cards: { a: card(), b: card() }, totals: { answered: 5, correct: 5 } })
    const out = mergeProgress(DEFAULT_PROGRESS, theirs)
    expect(Object.keys(out.cards).sort()).toEqual(['a', 'b'])
    expect(out.totals).toEqual({ answered: 5, correct: 5 })
  })
})
