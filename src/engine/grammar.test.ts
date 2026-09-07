import { describe, expect, it } from 'vitest'
import { NOUNS, noun } from '@/data/nouns'
import type { Adjective, Kasus, Numerus } from './grammar'
import {
  KASUS, dativePl, determiner, determinerForm, genitiveSg, nounPhrase, withPreposition,
} from './grammar'

const gut: Adjective = { word: 'gut', en: 'good' }

function detRow(id: string, slot: 'm' | 'f' | 'n' | 'pl'): Array<string | null> {
  return KASUS.map((k) => determinerForm(determiner(id), slot, k))
}

function phrase(nounId: string, det: string, kasus: Kasus, num: Numerus = 'sg', adj?: Adjective) {
  return nounPhrase(noun(nounId), { det, kasus, num, adj }).text
}

describe('determiners', () => {
  it('declines the definite article', () => {
    expect(detRow('def', 'm')).toEqual(['der', 'den', 'dem', 'des'])
    expect(detRow('def', 'f')).toEqual(['die', 'die', 'der', 'der'])
    expect(detRow('def', 'n')).toEqual(['das', 'das', 'dem', 'des'])
    expect(detRow('def', 'pl')).toEqual(['die', 'die', 'den', 'der'])
  })

  it('declines the ein-type determiners', () => {
    expect(detRow('indef', 'm')).toEqual(['ein', 'einen', 'einem', 'eines'])
    expect(detRow('indef', 'f')).toEqual(['eine', 'eine', 'einer', 'einer'])
    expect(detRow('indef', 'n')).toEqual(['ein', 'ein', 'einem', 'eines'])
    expect(detRow('kein', 'pl')).toEqual(['keine', 'keine', 'keinen', 'keiner'])
    expect(detRow('mein', 'm')).toEqual(['mein', 'meinen', 'meinem', 'meines'])
  })

  it('drops the stem -e- of euer before an ending', () => {
    expect(detRow('euer', 'm')).toEqual(['euer', 'euren', 'eurem', 'eures'])
    expect(detRow('euer', 'f')).toEqual(['eure', 'eure', 'eurer', 'eurer'])
    expect(detRow('euer', 'pl')).toEqual(['eure', 'eure', 'euren', 'eurer'])
  })

  it('keeps the stem -e- of unser', () => {
    expect(detRow('unser', 'f')).toEqual(['unsere', 'unsere', 'unserer', 'unserer'])
  })

  it('declines the der-type determiners', () => {
    expect(detRow('dies', 'm')).toEqual(['dieser', 'diesen', 'diesem', 'dieses'])
    expect(detRow('dies', 'n')).toEqual(['dieses', 'dieses', 'diesem', 'dieses'])
    expect(detRow('welch', 'pl')).toEqual(['welche', 'welche', 'welchen', 'welcher'])
  })

  it('returns nothing when there is no determiner', () => {
    expect(detRow('none', 'm')).toEqual([null, null, null, null])
  })
})

describe('adjective endings', () => {
  it('uses the weak pattern after a der-type determiner', () => {
    expect(phrase('mann', 'def', 'nom', 'sg', gut)).toBe('der gute Mann')
    expect(phrase('mann', 'def', 'akk', 'sg', gut)).toBe('den guten Mann')
    expect(phrase('mann', 'def', 'dat', 'sg', gut)).toBe('dem guten Mann')
    expect(phrase('mann', 'def', 'gen', 'sg', gut)).toBe('des guten Mannes')
    expect(phrase('frau', 'def', 'nom', 'sg', gut)).toBe('die gute Frau')
    expect(phrase('kind', 'def', 'nom', 'sg', gut)).toBe('das gute Kind')
    expect(phrase('kind', 'def', 'nom', 'pl', gut)).toBe('die guten Kinder')
  })

  it('uses the mixed pattern after an ein-type determiner', () => {
    expect(phrase('mann', 'indef', 'nom', 'sg', gut)).toBe('ein guter Mann')
    expect(phrase('mann', 'indef', 'akk', 'sg', gut)).toBe('einen guten Mann')
    expect(phrase('kind', 'indef', 'nom', 'sg', gut)).toBe('ein gutes Kind')
    expect(phrase('kind', 'indef', 'akk', 'sg', gut)).toBe('ein gutes Kind')
    expect(phrase('frau', 'indef', 'dat', 'sg', gut)).toBe('einer guten Frau')
  })

  it('uses the strong pattern with no determiner', () => {
    expect(phrase('wein', 'none', 'nom', 'sg', gut)).toBe('guter Wein')
    expect(phrase('wein', 'none', 'akk', 'sg', gut)).toBe('guten Wein')
    expect(phrase('wein', 'none', 'dat', 'sg', gut)).toBe('gutem Wein')
    expect(phrase('milch', 'none', 'dat', 'sg', gut)).toBe('guter Milch')
    expect(phrase('bier', 'none', 'nom', 'sg', gut)).toBe('gutes Bier')
    expect(phrase('kind', 'none', 'dat', 'pl', gut)).toBe('guten Kindern')
  })

  it('shortens adjective stems that lose a vowel', () => {
    const teuer: Adjective = { word: 'teuer', stem: 'teur', en: 'expensive' }
    const hoch: Adjective = { word: 'hoch', stem: 'hoh', en: 'high' }
    expect(phrase('auto', 'def', 'nom', 'sg', teuer)).toBe('das teure Auto')
    expect(phrase('berg', 'def', 'nom', 'sg', hoch)).toBe('der hohe Berg')
  })
})

describe('noun declension', () => {
  it('adds -n in the dative plural unless the plural already ends in -n or -s', () => {
    expect(dativePl('Kinder')).toBe('Kindern')
    expect(dativePl('Häuser')).toBe('Häusern')
    expect(dativePl('Frauen')).toBe('Frauen')
    expect(dativePl('Mädchen')).toBe('Mädchen')
    expect(dativePl('Autos')).toBe('Autos')
    expect(phrase('kind', 'def', 'dat', 'pl')).toBe('den Kindern')
    expect(phrase('auto', 'def', 'dat', 'pl')).toBe('den Autos')
  })

  it('picks -s or -es in the genitive singular', () => {
    expect(genitiveSg(noun('kind')).form).toBe('Kindes')
    expect(genitiveSg(noun('mann')).form).toBe('Mannes')
    expect(genitiveSg(noun('haus')).form).toBe('Hauses')
    expect(genitiveSg(noun('platz')).form).toBe('Platzes')
    expect(genitiveSg(noun('fluss')).form).toBe('Flusses')
    expect(genitiveSg(noun('lehrer')).form).toBe('Lehrers')
    expect(genitiveSg(noun('fenster')).form).toBe('Fensters')
    expect(genitiveSg(noun('maedchen')).form).toBe('Mädchens')
    expect(genitiveSg(noun('auto')).form).toBe('Autos')
    expect(genitiveSg(noun('see')).form).toBe('Sees')
    expect(genitiveSg(noun('fruehling')).form).toBe('Frühlings')
  })

  it('leaves feminine nouns unchanged in the singular', () => {
    expect(genitiveSg(noun('frau')).form).toBe('Frau')
    expect(phrase('frau', 'def', 'gen')).toBe('der Frau')
    expect(phrase('frau', 'def', 'dat')).toBe('der Frau')
  })

  it('declines the weak masculines', () => {
    expect(phrase('junge', 'def', 'nom')).toBe('der Junge')
    expect(phrase('junge', 'def', 'akk')).toBe('den Jungen')
    expect(phrase('junge', 'def', 'dat')).toBe('dem Jungen')
    expect(phrase('junge', 'def', 'gen')).toBe('des Jungen')
    expect(phrase('herr', 'def', 'akk')).toBe('den Herrn')
    expect(phrase('herr', 'def', 'gen')).toBe('des Herrn')
    expect(phrase('student', 'def', 'akk')).toBe('den Studenten')
    expect(phrase('mensch', 'def', 'dat')).toBe('dem Menschen')
  })

  it('adds -s to the Name type in the genitive', () => {
    expect(phrase('name', 'def', 'akk')).toBe('den Namen')
    expect(phrase('name', 'def', 'gen')).toBe('des Namens')
    expect(phrase('gedanke', 'def', 'gen')).toBe('des Gedankens')
    expect(phrase('herz', 'def', 'gen')).toBe('des Herzens')
  })
})

describe('preposition contractions', () => {
  const p = (prep: string, nounId: string, kasus: Kasus) =>
    withPreposition(prep, nounPhrase(noun(nounId), { det: 'def', kasus, num: 'sg' }))

  it('contracts where standard German requires it', () => {
    expect(p('in', 'haus', 'dat').text).toBe('im Haus')
    expect(p('in', 'haus', 'akk').text).toBe('ins Haus')
    expect(p('an', 'tisch', 'dat').text).toBe('am Tisch')
    expect(p('zu', 'bahnhof', 'dat').text).toBe('zum Bahnhof')
    expect(p('zu', 'schule', 'dat').text).toBe('zur Schule')
    expect(p('bei', 'arzt', 'dat').text).toBe('beim Arzt')
    expect(p('von', 'markt', 'dat').text).toBe('vom Markt')
  })

  it('keeps the uncontracted form as an accepted answer', () => {
    expect(p('in', 'haus', 'dat').alts).toContain('in dem Haus')
  })

  it('offers the optional contractions as alternatives only', () => {
    const auf = p('auf', 'sofa', 'akk')
    expect(auf.text).toBe('auf das Sofa')
    expect(auf.alts).toContain('aufs Sofa')
  })

  it('does not contract when there is no article', () => {
    const bare = withPreposition('nach', nounPhrase(noun('haus'), { det: 'none', kasus: 'dat', num: 'sg' }))
    expect(bare.text).toBe('nach Haus')
  })
})

describe('noun dataset integrity', () => {
  it('has unique ids', () => {
    const ids = NOUNS.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('produces every case in the singular, and in the plural where one exists', () => {
    for (const n of NOUNS) {
      for (const k of KASUS) {
        const sg = nounPhrase(n, { det: 'def', kasus: k, num: 'sg' })
        expect(sg.text, `${n.word} sg ${k}`).toMatch(/^(der|die|das|den|dem|des) \S/)
        if (n.plural) {
          const pl = nounPhrase(n, { det: 'def', kasus: k, num: 'pl' })
          expect(pl.text, `${n.word} pl ${k}`).toMatch(/^(die|den|der) \S/)
        }
      }
    }
  })

  it('capitalises every noun and never leaves an empty plural marked as usable', () => {
    for (const n of NOUNS) {
      expect(n.word[0], n.word).toBe(n.word[0]?.toUpperCase())
      if (n.plural) expect(n.plural[0], n.plural).toBe(n.plural[0]?.toUpperCase())
    }
  })
})
