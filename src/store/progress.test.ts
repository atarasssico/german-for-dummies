import { describe, expect, it } from 'vitest'
import { streakOf, todayKey } from './progress'

describe('todayKey', () => {
  it('formats a local date', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(todayKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('streakOf', () => {
  const day = (offset: number) => {
    const d = new Date(2026, 8, 7)
    d.setDate(d.getDate() + offset)
    return todayKey(d)
  }
  const today = day(0)

  it('counts consecutive days ending today', () => {
    const days = {
      [day(0)]: { answered: 3, correct: 2 },
      [day(-1)]: { answered: 5, correct: 5 },
      [day(-2)]: { answered: 1, correct: 0 },
      [day(-4)]: { answered: 9, correct: 9 },
    }
    expect(streakOf(days, today)).toBe(3)
  })

  it('keeps yesterday’s streak alive before the first answer of today', () => {
    const days = {
      [day(-1)]: { answered: 4, correct: 4 },
      [day(-2)]: { answered: 4, correct: 4 },
    }
    expect(streakOf(days, today)).toBe(2)
  })

  it('breaks after a missed day', () => {
    const days = { [day(-2)]: { answered: 4, correct: 4 } }
    expect(streakOf(days, today)).toBe(0)
  })

  it('is zero with no history', () => {
    expect(streakOf({}, today)).toBe(0)
  })

  it('ignores a day that was opened but never answered', () => {
    const days = { [day(0)]: { answered: 0, correct: 0 }, [day(-1)]: { answered: 2, correct: 1 } }
    expect(streakOf(days, today)).toBe(1)
  })
})
