import { describe, expect, it } from 'vitest'
import type { CardState } from './srs'
import { BOX_INTERVALS, MAX_BOX, isDue, newCard, pickSession, review, strength, summarise } from './srs'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_700_000_000_000

describe('review', () => {
  it('promotes a card one box on a correct answer', () => {
    const first = review(undefined, true, NOW)
    expect(first.box).toBe(1)
    expect(first.reps).toBe(1)
    expect(first.lapses).toBe(0)
    expect(first.due).toBe(NOW + (BOX_INTERVALS[1] ?? 0) * DAY)
  })

  it('sends a card all the way back on a wrong answer', () => {
    const strong: CardState = { box: 4, due: NOW + 8 * DAY, reps: 9, lapses: 1, last: NOW }
    const after = review(strong, false, NOW)
    expect(after.box).toBe(0)
    expect(after.due).toBe(NOW)
    expect(after.lapses).toBe(2)
    expect(isDue(after, NOW)).toBe(true)
  })

  it('caps promotion at the last box', () => {
    let card = newCard(NOW)
    for (let i = 0; i < 20; i++) card = review(card, true, NOW)
    expect(card.box).toBe(MAX_BOX)
    expect(strength(card)).toBe(1)
  })

  it('treats an unseen card as due', () => {
    expect(isDue(undefined, NOW)).toBe(true)
    expect(strength(undefined)).toBe(0)
  })
})

describe('pickSession', () => {
  const pool = ['a', 'b', 'c', 'd', 'e']

  it('puts the most overdue cards first', () => {
    const states = {
      a: { box: 1, due: NOW - 5 * DAY, reps: 1, lapses: 0, last: 0 },
      b: { box: 1, due: NOW - 1 * DAY, reps: 1, lapses: 0, last: 0 },
      c: { box: 3, due: NOW + 4 * DAY, reps: 3, lapses: 0, last: 0 },
    }
    const session = pickSession({ pool, states, count: 5, now: NOW })
    expect(session.slice(0, 2)).toEqual(['a', 'b'])
    // unseen items come next, in pool order, which is commonest first
    expect(session.slice(2, 4)).toEqual(['d', 'e'])
    expect(session[4]).toBe('c')
  })

  it('respects the requested size', () => {
    const session = pickSession({ pool, states: {}, count: 3, now: NOW })
    expect(session).toHaveLength(3)
    expect(new Set(session).size).toBe(3)
  })

  it('returns nothing for an empty pool', () => {
    expect(pickSession({ pool: [], states: {}, count: 10, now: NOW })).toEqual([])
  })
})

describe('summarise', () => {
  it('counts unseen items as due and as zero progress', () => {
    const s = summarise(['a', 'b', 'c', 'd'], {
      a: { box: MAX_BOX, due: NOW + 32 * DAY, reps: 8, lapses: 0, last: 0 },
      b: { box: 1, due: NOW - DAY, reps: 1, lapses: 0, last: 0 },
    }, NOW)
    expect(s).toMatchObject({ total: 4, seen: 2, due: 3, mastered: 1 })
    expect(s.progress).toBeCloseTo((1 + 1 / MAX_BOX) / 4, 5)
  })

  it('does not divide by zero', () => {
    expect(summarise([], {}, NOW).progress).toBe(0)
  })
})

describe('summary numbers a person reads', () => {
  const pool = Array.from({ length: 1420 }, (_, i) => `card-${i}`)

  it('moves on the very first answer', () => {
    const one = summarise(pool, { 'card-0': review(undefined, true, NOW) }, NOW)
    expect(one.seen).toBe(1)
    // the whole-deck percentage cannot show this, which is why it is not displayed
    expect(Math.round(one.progress * 100)).toBe(0)
  })

  it('counts a full session, where the percentage still rounds to zero', () => {
    const states: Record<string, CardState> = {}
    for (const id of pool.slice(0, 12)) states[id] = review(undefined, true, NOW)
    const s = summarise(pool, states, NOW)
    expect(s.seen).toBe(12)
    expect(Math.round(s.progress * 100)).toBe(0)
    expect(s.strengthOfSeen).toBeCloseTo(1 / MAX_BOX, 5)
  })

  it('counts a card as known once it reaches box 4', () => {
    let card = newCard(NOW)
    for (let i = 0; i < 3; i++) card = review(card, true, NOW)
    expect(summarise(['a'], { a: card }, NOW).known).toBe(0)
    card = review(card, true, NOW)
    expect(card.box).toBe(4)
    expect(summarise(['a'], { a: card }, NOW).known).toBe(1)
    expect(summarise(['a'], { a: card }, NOW).mastered).toBe(0)
  })

  it('reports strength among started cards, not across the whole deck', () => {
    let card = newCard(NOW)
    for (let i = 0; i < MAX_BOX; i++) card = review(card, true, NOW)
    const s = summarise(pool, { 'card-0': card }, NOW)
    expect(s.strengthOfSeen).toBe(1)
    expect(s.progress).toBeCloseTo(1 / pool.length, 6)
  })
})


describe('teaching order', () => {
  it('introduces unseen cards in pool order rather than at random', () => {
    // The pool arrives commonest first, so a first session must not reshuffle it.
    const pool = ['zeit', 'jahr', 'mann', 'zeuge', 'automat']
    for (let i = 0; i < 20; i++) {
      expect(pickSession({ pool, states: {}, count: 3, now: NOW })).toEqual(['zeit', 'jahr', 'mann'])
    }
  })

  it('still puts overdue cards ahead of new ones', () => {
    const states = { zeuge: { box: 1, due: NOW - DAY, reps: 1, lapses: 0, last: 0 } }
    const session = pickSession({ pool: ['zeit', 'jahr', 'zeuge'], states, count: 3, now: NOW })
    expect(session[0]).toBe('zeuge')
    expect(session.slice(1)).toEqual(['zeit', 'jahr'])
  })
})
