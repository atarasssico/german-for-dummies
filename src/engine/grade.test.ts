import { describe, expect, it } from 'vitest'
import { diffChars, foldUmlauts, grade } from './grade'

describe('grade', () => {
  it('accepts an exact answer', () => {
    const r = grade('dem Kind', 'dem Kind')
    expect(r.verdict).toBe('correct')
    expect(r.leniency).toBe('exact')
    expect(r.hint).toBeUndefined()
  })

  it('ignores surrounding whitespace and trailing punctuation', () => {
    expect(grade('  dem Kind  ', 'dem Kind').verdict).toBe('correct')
    expect(grade('dem  Kind', 'dem Kind').verdict).toBe('correct')
    expect(grade('gib!', 'gib').verdict).toBe('correct')
  })

  it('accepts a declared variant and names the canonical form', () => {
    const r = grade('fandst', 'fandest', ['fandst'])
    expect(r.verdict).toBe('correct')
    expect(r.leniency).toBe('variant')
    expect(r.hint).toContain('fandest')
  })

  it('accepts ASCII umlauts and shows the proper spelling', () => {
    const r = grade('gaebe', 'gäbe')
    expect(r.verdict).toBe('correct')
    expect(r.leniency).toBe('umlaut')
    expect(r.hint).toContain('gäbe')
    expect(grade('heisst', 'heißt').verdict).toBe('correct')
    expect(grade('waere', 'wäre').verdict).toBe('correct')
  })

  it('still treats a missing umlaut as a mistake', () => {
    // a is not ä: this is a grammar error, not a keyboard one
    expect(grade('gabe', 'gäbe').verdict).toBe('wrong')
    expect(grade('fahrst', 'fährst').verdict).toBe('wrong')
  })

  it('rejects a lowercase noun by default but explains why', () => {
    const r = grade('dem kind', 'dem Kind')
    expect(r.verdict).toBe('wrong')
    expect(r.leniency).toBe('capitalisation')
    expect(r.hint).toContain('capital')
  })

  it('can be told to let capitalisation slide', () => {
    expect(grade('dem kind', 'dem Kind', [], { tolerateCase: true }).verdict).toBe('correct')
  })

  it('can be told to require real umlauts', () => {
    expect(grade('gaebe', 'gäbe', [], { tolerateAsciiUmlauts: false }).verdict).toBe('wrong')
  })

  it('flags a one-character slip', () => {
    const r = grade('dem Kinde', 'dem Kind')
    expect(r.verdict).toBe('wrong')
    expect(r.nearMiss).toBe(true)
    expect(r.hint).toBe('One character off.')
  })

  it('does not flag a wholly different answer as a near miss', () => {
    const r = grade('der Junge', 'dem Kind')
    expect(r.verdict).toBe('wrong')
    expect(r.nearMiss).toBe(false)
  })

  it('handles an empty answer', () => {
    const r = grade('', 'dem Kind')
    expect(r.verdict).toBe('wrong')
    expect(r.nearMiss).toBe(false)
    expect(r.hint).toBeUndefined()
  })
})

describe('foldUmlauts', () => {
  it('folds down rather than expanding up', () => {
    expect(foldUmlauts('gäbe')).toBe('gaebe')
    expect(foldUmlauts('heißt')).toBe('heisst')
    expect(foldUmlauts('Äpfel')).toBe('Aepfel')
    // words that already contain ue are untouched
    expect(foldUmlauts('neue')).toBe('neue')
  })
})

describe('diffChars', () => {
  it('marks characters the answer is missing', () => {
    expect(diffChars('den Kind', 'dem Kind')).toEqual([
      { op: 'same', text: 'de' },
      { op: 'extra', text: 'n' },
      { op: 'missing', text: 'm' },
      { op: 'same', text: ' Kind' },
    ])
  })

  it('reports a perfect match as one run', () => {
    expect(diffChars('gib', 'gib')).toEqual([{ op: 'same', text: 'gib' }])
  })

  it('reports a trailing omission', () => {
    expect(diffChars('des Kind', 'des Kindes')).toEqual([
      { op: 'same', text: 'des Kind' },
      { op: 'missing', text: 'es' },
    ])
  })

  it('reconstructs both strings from the parts', () => {
    const parts = diffChars('einem gutes Kind', 'einem guten Kind')
    const actual = parts.filter((p) => p.op !== 'missing').map((p) => p.text).join('')
    const expected = parts.filter((p) => p.op !== 'extra').map((p) => p.text).join('')
    expect(actual).toBe('einem gutes Kind')
    expect(expected).toBe('einem guten Kind')
  })
})
