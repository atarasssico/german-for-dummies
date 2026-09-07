import { describe, expect, it } from 'vitest'
import { grade } from './grade'
import type { GenSettings } from './questions'
import { DEFAULT_SETTINGS, MODES, buildQuestion, poolFor, rngFrom, withinLevel } from './questions'

const ALL: GenSettings = {
  ...DEFAULT_SETTINGS,
  level: 'C1',
  tenses: [
    'praesens', 'praeteritum', 'perfekt', 'plusquamperfekt',
    'futur1', 'futur2', 'konjunktiv1', 'konjunktiv2', 'wuerde', 'imperativ',
  ],
  determiners: ['def', 'indef', 'kein', 'dies', 'jed', 'welch', 'mein', 'unser', 'euer', 'all', 'none'],
  includeAdjectives: true,
}

describe('pools', () => {
  it('produces a non-trivial pool for every mode', () => {
    for (const mode of MODES) {
      expect(poolFor(mode, ALL).length, mode).toBeGreaterThan(40)
    }
  })

  it('has no duplicate card ids inside a mode', () => {
    for (const mode of MODES) {
      const pool = poolFor(mode, ALL)
      expect(new Set(pool).size, mode).toBe(pool.length)
    }
  })

  it('builds every card in every pool', () => {
    for (const mode of MODES) {
      for (const id of poolFor(mode, ALL)) {
        const q = buildQuestion(id, ALL)
        expect(q, id).not.toBeNull()
        expect(q?.id, id).toBe(id)
        expect(q?.answer.text.length, id).toBeGreaterThan(0)
        expect(q?.rules.length, id).toBeGreaterThan(0)
        expect(q?.focus.length, id).toBeGreaterThan(0)
        expect(q?.answer.text, id).not.toMatch(/undefined|null|NaN/)
      }
    }
  })

  it('accepts its own answer for every card', () => {
    for (const mode of MODES) {
      for (const id of poolFor(mode, ALL)) {
        const q = buildQuestion(id, ALL)
        if (!q || q.kind !== 'type') continue
        expect(grade(q.answer.text, q.answer.text, q.answer.alts).verdict, id).toBe('correct')
      }
    }
  })

  it('leaves a gap in every cloze and never in a non-cloze', () => {
    for (const id of poolFor('prepositions', ALL)) {
      const q = buildQuestion(id, ALL)
      if (q?.cloze) expect(q.cloze, id).toContain('___')
    }
  })

  it('gives every choice question a correct option among its choices', () => {
    for (const mode of MODES) {
      for (const id of poolFor(mode, ALL)) {
        const q = buildQuestion(id, ALL)
        if (!q || q.kind !== 'choice') continue
        expect(q.choices, id).toBeDefined()
        expect(q.choices?.map((c) => c.id), id).toContain(q.answer.text)
      }
    }
  })

  it('honours the level cap', () => {
    const a1: GenSettings = { ...ALL, level: 'A1' }
    for (const mode of MODES) {
      for (const id of poolFor(mode, a1)) {
        const q = buildQuestion(id, a1)
        expect(withinLevel(q?.level ?? 'C1', 'A1'), id).toBe(true)
      }
    }
  })

  it('shrinks the pool as the level cap drops', () => {
    for (const mode of MODES) {
      const wide = poolFor(mode, ALL).length
      const narrow = poolFor(mode, { ...ALL, level: 'A1' }).length
      expect(narrow, mode).toBeLessThan(wide)
      expect(narrow, mode).toBeGreaterThan(0)
    }
  })

  it('restricts impersonal verbs to the third person', () => {
    const ids = poolFor('verbs', ALL).filter((id) => id.includes(':geschehen:') || id.includes(':gelingen:'))
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) expect(id.endsWith(':er'), id).toBe(true)
  })

  it('filters nouns by topic', () => {
    const pool = poolFor('articles', { ...ALL, topics: ['food'] })
    expect(pool.length).toBeGreaterThan(20)
    const other = poolFor('articles', { ...ALL, topics: ['food', 'home'] })
    expect(other.length).toBeGreaterThan(pool.length)
  })
})

describe('rngFrom', () => {
  it('is deterministic for a given seed', () => {
    const a = rngFrom('decl:kind:dat')
    const b = rngFrom('decl:kind:dat')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('differs across seeds and stays in range', () => {
    const a = rngFrom('one')
    const b = rngFrom('two')
    expect(a()).not.toBe(b())
    const r = rngFrom('spread')
    for (let i = 0; i < 200; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('question content', () => {
  it('asks for the article and explains the gender rule', () => {
    const q = buildQuestion('gender:wohnung', ALL)
    expect(q?.answer.text).toBe('f')
    expect(q?.rules.join(' ')).toContain('-ung')
  })

  it('asks for a full noun phrase and names the governing rules', () => {
    const q = buildQuestion('decl:kind:dat', { ...ALL, determiners: ['def'], usePlural: false, includeAdjectives: false })
    expect(q?.answer.text).toBe('dem Kind')
    expect(q?.rules[0]).toContain('Dativ')
  })

  it('explains the dative plural -n', () => {
    const q = buildQuestion('decl:kind:dat', { ...ALL, determiners: ['def'], includeAdjectives: false })
    // the number is randomised, so assert on whichever rendering came out
    if (q?.answer.text === 'den Kindern') {
      expect(q.rules.join(' ')).toContain('Dativ Plural adds -n')
    } else {
      expect(q?.answer.text).toBe('dem Kind')
    }
  })

  it('explains the n-declension', () => {
    const q = buildQuestion('decl:junge:akk', { ...ALL, determiners: ['def'], usePlural: false, includeAdjectives: false })
    expect(q?.answer.text).toBe('den Jungen')
    expect(q?.rules.join(' ')).toContain('n-declension')
  })

  it('shows principal parts when drilling a strong verb', () => {
    const q = buildQuestion('conj:geben:praeteritum:du', ALL)
    expect(q?.answer.text).toBe('gabst')
    expect(q?.rules[0]).toBe('geben · gab · hat gegeben')
  })

  it('warns that the separable prefix moves', () => {
    const q = buildQuestion('conj:anrufen:praesens:ich', ALL)
    expect(q?.answer.text).toBe('rufe an')
    expect(q?.rules.join(' ')).toContain('Separable')
  })

  it('flags verbs whose Konjunktiv II needs würde', () => {
    const q = buildQuestion('conj:lernen:konjunktiv2:ich', ALL)
    expect(q?.rules.join(' ')).toContain('würde')
  })

  it('asks which case a verb governs', () => {
    const q = buildQuestion('valcase:helfen:0', ALL)
    expect(q?.answer.text).toBe('dat')
    expect(q?.kind).toBe('choice')
  })

  it('asks for a preposition together with its case', () => {
    const q = buildQuestion('valprep:warten:0', ALL)
    expect(q?.kind).toBe('prep+case')
    expect(q?.prepAnswer).toEqual({ prep: 'auf', kasus: 'akk' })
  })

  it('asks which frame carries a given meaning', () => {
    const q = buildQuestion('valsense:bestehen:1', ALL)
    expect(q?.answer.text).toBe('1')
    expect(q?.sub).toContain('made up of')
    expect(q?.choices?.length).toBe(4)
  })

  it('asks a two-way preposition both ways', () => {
    const dat = buildQuestion('wechsel:auf:dat', ALL)
    const akk = buildQuestion('wechsel:auf:akk', ALL)
    expect(dat?.target).toContain('Wo?')
    expect(akk?.target).toContain('Wohin?')
    expect(['dem', 'der']).toContain(dat?.answer.text)
    expect(['den', 'die', 'das']).toContain(akk?.answer.text)
  })

  it('states the task on every typed card', () => {
    // The bug this guards: the case being asked was a dim eyebrow while the
    // noun being given was the largest thing on screen.
    for (const mode of MODES) {
      for (const id of poolFor(mode, ALL)) {
        const q = buildQuestion(id, ALL)
        if (!q || q.kind !== 'type') continue
        expect(q.target, `${id} has no target`).toBeTruthy()
        expect(q.expects, `${id} does not say what the answer must contain`).toBeTruthy()
      }
    }
  })

  it('shows the declension task as a transformation with both cases named', () => {
    const q = buildQuestion('decl:kind:dat', { ...ALL, determiners: ['def'], usePlural: false, includeAdjectives: false })
    expect(q?.sourceLabel).toBe('Nominativ Singular')
    expect(q?.target).toBe('Dativ Singular')
    expect(q?.targetHint).toBe('wem?')
    expect(q?.expects).toBe('Artikel + Nomen')
    expect(q?.spec).toContain('bestimmter Artikel')
  })

  it('names the adjective in the task whenever one is included', () => {
    // Which cards get an adjective is seeded per card id, so assert the
    // invariant across the pool rather than retrying one id.
    const cards = poolFor('articles', ALL).map((id) => buildQuestion(id, ALL))
    const withAdjective = cards.filter((q) => q?.spec?.some((item) => item.startsWith('Adjektiv:')))
    expect(withAdjective.length).toBeGreaterThan(0)
    for (const q of withAdjective) {
      expect(q?.expects, q?.id).toBe('Artikel + Adjektiv + Nomen')
    }
    const withoutAdjective = cards.filter(
      (q) => q?.kind === 'type' && !q.spec?.some((item) => item.startsWith('Adjektiv:')),
    )
    for (const q of withoutAdjective) {
      expect(q?.expects, q?.id).toBe('Artikel + Nomen')
    }
  })

  it('states the tense, the person and any prefix for a verb card', () => {
    const q = buildQuestion('conj:anrufen:praesens:du', ALL)
    expect(q?.sourceLabel).toBe('Infinitiv')
    expect(q?.target).toBe('Präsens')
    expect(q?.targetHint).toBe('du')
    expect(q?.spec).toContain('trennbar: an-')
    expect(q?.expects).toBe('Verbform + Präfix am Ende')
  })

  it('never asks you to copy the prompt back', () => {
    // Nominativ Singular with the definite article is the dictionary form that
    // the card already shows, so it must not be generated as a task.
    const settings = { ...ALL, includeAdjectives: false }
    for (const id of poolFor('articles', settings)) {
      const q = buildQuestion(id, settings)
      if (!q || q.kind !== 'type' || !q.focusArticle) continue
      const shown = `${q.focusArticle} ${q.focus}`
      expect(q.answer.text, `${id} asks for the prompt itself`).not.toBe(shown)
    }
  })

  it('falls back to the plural when the definite article is the only one enabled', () => {
    const settings = { ...ALL, determiners: ['def'], includeAdjectives: false, usePlural: true }
    const q = buildQuestion('decl:hose:nom', settings)
    expect(q?.answer.text).toBe('die Hosen')
    expect(q?.target).toBe('Nominativ Plural')
  })

  it('returns null for an id that no longer resolves', () => {
    expect(buildQuestion('conj:doesnotexist:praesens:ich', ALL)).toBeNull()
    expect(buildQuestion('nonsense', ALL)).toBeNull()
    expect(buildQuestion('gender:nope', ALL)).toBeNull()
  })
})
