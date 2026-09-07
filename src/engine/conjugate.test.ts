import { describe, expect, it } from 'vitest'
import { VERBS, verb } from '@/data/verbs'
import type { PersonKey, Tense } from './conjugate'
import { conjugate, konj2Base, PERSONS, partizip2, praetBase, prefersWuerde } from './conjugate'

function row(id: string, tense: Tense): string[] {
  return PERSONS.map((p) => conjugate(verb(id), tense, p).text)
}

function form(id: string, tense: Tense, p: PersonKey): string {
  return conjugate(verb(id), tense, p).text
}

describe('Präsens', () => {
  it('conjugates the auxiliaries', () => {
    expect(row('sein', 'praesens')).toEqual(['bin', 'bist', 'ist', 'sind', 'seid', 'sind'])
    expect(row('haben', 'praesens')).toEqual(['habe', 'hast', 'hat', 'haben', 'habt', 'haben'])
    expect(row('werden', 'praesens')).toEqual(['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'])
  })

  it('applies the e -> i stem change', () => {
    expect(row('geben', 'praesens')).toEqual(['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'geben'])
    expect(row('nehmen', 'praesens')).toEqual(['nehme', 'nimmst', 'nimmt', 'nehmen', 'nehmt', 'nehmen'])
    expect(form('lesen', 'praesens', 'du')).toBe('liest')
    expect(form('lesen', 'praesens', 'er')).toBe('liest')
  })

  it('applies the a -> ä stem change', () => {
    expect(row('fahren', 'praesens')).toEqual(['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'])
    expect(form('halten', 'praesens', 'du')).toBe('hältst')
    expect(form('laden', 'praesens', 'er')).toBe('lädt')
  })

  it('inserts a linking -e- only where the stem needs one', () => {
    expect(row('arbeiten', 'praesens')).toEqual([
      'arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet', 'arbeiten',
    ])
    expect(form('atmen', 'praesens', 'du')).toBe('atmest')
    expect(form('oeffnen', 'praesens', 'du')).toBe('öffnest')
    // -ch- is a real consonant cluster, a lengthening -h- is not
    expect(form('rechnen', 'praesens', 'du')).toBe('rechnest')
    expect(form('zeichnen', 'praesens', 'du')).toBe('zeichnest')
    expect(form('wohnen', 'praesens', 'du')).toBe('wohnst')
    expect(form('lernen', 'praesens', 'du')).toBe('lernst')
    expect(form('kommen', 'praesens', 'du')).toBe('kommst')
  })

  it('merges the du ending after a sibilant stem', () => {
    expect(form('heissen', 'praesens', 'du')).toBe('heißt')
    expect(form('sitzen', 'praesens', 'du')).toBe('sitzt')
    expect(form('tanzen', 'praesens', 'du')).toBe('tanzt')
    expect(form('reisen', 'praesens', 'du')).toBe('reist')
  })

  it('handles -eln and -ern verbs', () => {
    expect(row('sammeln', 'praesens')).toEqual([
      'sammle', 'sammelst', 'sammelt', 'sammeln', 'sammelt', 'sammeln',
    ])
    expect(row('wandern', 'praesens')).toEqual([
      'wandere', 'wanderst', 'wandert', 'wandern', 'wandert', 'wandern',
    ])
    expect(form('laecheln', 'praesens', 'ich')).toBe('lächle')
  })

  it('conjugates the modals and wissen', () => {
    expect(row('koennen', 'praesens')).toEqual(['kann', 'kannst', 'kann', 'können', 'könnt', 'können'])
    expect(row('muessen', 'praesens')).toEqual(['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'])
    expect(row('wissen', 'praesens')).toEqual(['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'])
    expect(row('moegen', 'praesens')).toEqual(['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'])
  })

  it('conjugates tun', () => {
    expect(row('tun', 'praesens')).toEqual(['tue', 'tust', 'tut', 'tun', 'tut', 'tun'])
  })

  it('sends the separable prefix to the end of the clause', () => {
    expect(row('anrufen', 'praesens')).toEqual([
      'rufe an', 'rufst an', 'ruft an', 'rufen an', 'ruft an', 'rufen an',
    ])
    expect(form('einladen', 'praesens', 'du')).toBe('lädst ein')
    expect(form('aufstehen', 'praesens', 'er')).toBe('steht auf')
  })

  it('places the reflexive pronoun after the finite verb', () => {
    expect(row('sich_freuen', 'praesens')).toEqual([
      'freue mich', 'freust dich', 'freut sich', 'freuen uns', 'freut euch', 'freuen sich',
    ])
    expect(form('sich_vorstellen', 'praesens', 'ich')).toBe('stelle mir vor')
  })
})

describe('Präteritum', () => {
  it('uses the long endings on a strong stem', () => {
    expect(row('geben', 'praeteritum')).toEqual(['gab', 'gabst', 'gab', 'gaben', 'gabt', 'gaben'])
    expect(row('gehen', 'praeteritum')).toEqual(['ging', 'gingst', 'ging', 'gingen', 'gingt', 'gingen'])
    expect(row('sein', 'praeteritum')).toEqual(['war', 'warst', 'war', 'waren', 'wart', 'waren'])
  })

  it('adds a linking -e- to strong stems ending in -d/-t', () => {
    expect(row('finden', 'praeteritum')).toEqual(['fand', 'fandest', 'fand', 'fanden', 'fandet', 'fanden'])
    expect(conjugate(verb('finden'), 'praeteritum', 'du').alts).toContain('fandst')
    expect(row('bitten', 'praeteritum')).toEqual(['bat', 'batest', 'bat', 'baten', 'batet', 'baten'])
    expect(form('halten', 'praeteritum', 'du')).toBe('hieltest')
  })

  it('adds a linking -e- to strong stems ending in a sibilant', () => {
    expect(row('sitzen', 'praeteritum')).toEqual(['saß', 'saßest', 'saß', 'saßen', 'saßt', 'saßen'])
    expect(form('lesen', 'praeteritum', 'ihr')).toBe('last')
  })

  it('uses the short endings on a weak stem', () => {
    expect(row('lernen', 'praeteritum')).toEqual([
      'lernte', 'lerntest', 'lernte', 'lernten', 'lerntet', 'lernten',
    ])
    expect(row('arbeiten', 'praeteritum')).toEqual([
      'arbeitete', 'arbeitetest', 'arbeitete', 'arbeiteten', 'arbeitetet', 'arbeiteten',
    ])
    expect(row('werden', 'praeteritum')).toEqual([
      'wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden',
    ])
    expect(row('koennen', 'praeteritum')).toEqual([
      'konnte', 'konntest', 'konnte', 'konnten', 'konntet', 'konnten',
    ])
  })

  it('accepts both stems where the verb has two', () => {
    const f = conjugate(verb('senden'), 'praeteritum', 'ich')
    expect(f.text).toBe('sandte')
    expect(f.alts).toContain('sendete')
  })
})

describe('Partizip II and the compound tenses', () => {
  it('derives weak participles', () => {
    expect(partizip2(verb('lernen'))).toBe('gelernt')
    expect(partizip2(verb('arbeiten'))).toBe('gearbeitet')
    expect(partizip2(verb('sammeln'))).toBe('gesammelt')
    expect(partizip2(verb('wandern'))).toBe('gewandert')
    expect(partizip2(verb('oeffnen'))).toBe('geöffnet')
  })

  it('drops ge- after an inseparable prefix or -ieren', () => {
    expect(partizip2(verb('besuchen'))).toBe('besucht')
    expect(partizip2(verb('erzaehlen'))).toBe('erzählt')
    expect(partizip2(verb('studieren'))).toBe('studiert')
    expect(partizip2(verb('uebersetzen'))).toBe('übersetzt')
    expect(partizip2(verb('wiederholen'))).toBe('wiederholt')
  })

  it('puts ge- between the prefix and the stem of a separable verb', () => {
    expect(partizip2(verb('anrufen'))).toBe('angerufen')
    expect(partizip2(verb('einladen'))).toBe('eingeladen')
    expect(partizip2(verb('einkaufen'))).toBe('eingekauft')
    expect(partizip2(verb('zuhoeren'))).toBe('zugehört')
    expect(partizip2(verb('mitbringen'))).toBe('mitgebracht')
  })

  it('picks the right auxiliary', () => {
    expect(form('gehen', 'perfekt', 'ich')).toBe('bin gegangen')
    expect(form('lernen', 'perfekt', 'ich')).toBe('habe gelernt')
    expect(form('anrufen', 'perfekt', 'ich')).toBe('habe angerufen')
    expect(form('sich_freuen', 'perfekt', 'ich')).toBe('habe mich gefreut')
    expect(form('gehen', 'plusquamperfekt', 'er')).toBe('war gegangen')
  })

  it('accepts the second auxiliary where the verb allows one', () => {
    const f = conjugate(verb('fahren'), 'perfekt', 'ich')
    expect(f.text).toBe('bin gefahren')
    expect(f.alts).toContain('habe gefahren')
  })

  it('builds the future tenses', () => {
    expect(form('lernen', 'futur1', 'ich')).toBe('werde lernen')
    expect(form('anrufen', 'futur1', 'du')).toBe('wirst anrufen')
    expect(form('gehen', 'futur2', 'ich')).toBe('werde gegangen sein')
    expect(form('lernen', 'futur2', 'ich')).toBe('werde gelernt haben')
  })
})

describe('Konjunktiv', () => {
  it('builds Konjunktiv I from the infinitive stem', () => {
    expect(row('haben', 'konjunktiv1')).toEqual(['habe', 'habest', 'habe', 'haben', 'habet', 'haben'])
    expect(row('sein', 'konjunktiv1')).toEqual(['sei', 'seist', 'sei', 'seien', 'seiet', 'seien'])
    expect(form('geben', 'konjunktiv1', 'er')).toBe('gebe')
    expect(form('koennen', 'konjunktiv1', 'er')).toBe('könne')
  })

  it('umlauts the Präteritum stem for Konjunktiv II', () => {
    const expected: Record<string, string> = {
      geben: 'gäbe', kommen: 'käme', fahren: 'führe', gehen: 'ginge', finden: 'fände',
      lesen: 'läse', ziehen: 'zöge', trinken: 'tränke', sitzen: 'säße', liegen: 'läge',
      nehmen: 'nähme', sprechen: 'spräche', schliessen: 'schlösse', laufen: 'liefe',
      tragen: 'trüge', beginnen: 'begänne', schwimmen: 'schwämme', tun: 'täte',
    }
    for (const [id, want] of Object.entries(expected)) {
      expect(konj2Base(verb(id)), id).toBe(want)
    }
  })

  it('uses the declared vowel where the rule would be wrong', () => {
    expect(konj2Base(verb('werfen'))).toBe('würfe')
    expect(konj2Base(verb('sterben'))).toBe('stürbe')
    expect(konj2Base(verb('werben'))).toBe('würbe')
    expect(konj2Base(verb('bringen'))).toBe('brächte')
    expect(konj2Base(verb('denken'))).toBe('dächte')
    expect(konj2Base(verb('wissen'))).toBe('wüsste')
    expect(konj2Base(verb('sein'))).toBe('wäre')
    expect(konj2Base(verb('haben'))).toBe('hätte')
    expect(konj2Base(verb('koennen'))).toBe('könnte')
  })

  it('conjugates Konjunktiv II', () => {
    expect(row('sein', 'konjunktiv2')).toEqual(['wäre', 'wärest', 'wäre', 'wären', 'wäret', 'wären'])
    expect(conjugate(verb('sein'), 'konjunktiv2', 'du').alts).toContain('wärst')
    expect(row('haben', 'konjunktiv2')).toEqual([
      'hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten',
    ])
    expect(row('geben', 'konjunktiv2')).toEqual([
      'gäbe', 'gäbest', 'gäbe', 'gäben', 'gäbet', 'gäben',
    ])
  })

  it('flags the verbs where Konjunktiv II collides with the Präteritum', () => {
    expect(prefersWuerde(verb('lernen'))).toBe(true)
    expect(prefersWuerde(verb('geben'))).toBe(false)
    expect(prefersWuerde(verb('sein'))).toBe(false)
    expect(form('lernen', 'wuerde', 'ich')).toBe('würde lernen')
  })
})

describe('Imperativ', () => {
  it('builds the du form', () => {
    expect(form('geben', 'imperativ', 'du')).toBe('gib')
    expect(form('nehmen', 'imperativ', 'du')).toBe('nimm')
    expect(form('lesen', 'imperativ', 'du')).toBe('lies')
    expect(form('sein', 'imperativ', 'du')).toBe('sei')
    expect(form('arbeiten', 'imperativ', 'du')).toBe('arbeite')
    expect(form('sammeln', 'imperativ', 'du')).toBe('sammle')
    expect(form('sich_entschuldigen', 'imperativ', 'du')).toBe('entschuldige dich')
    const lern = conjugate(verb('lernen'), 'imperativ', 'du')
    expect(lern.text).toBe('lern')
    expect(lern.alts).toContain('lerne')
  })

  it('keeps the prefix and the reflexive pronoun in place', () => {
    expect(form('anrufen', 'imperativ', 'du')).toBe('ruf an')
    expect(form('anrufen', 'imperativ', 'ihr')).toBe('ruft an')
    expect(form('anrufen', 'imperativ', 'sie')).toBe('rufen Sie an')
    expect(form('sich_setzen', 'imperativ', 'du')).toBe('setz dich')
    expect(form('sich_setzen', 'imperativ', 'sie')).toBe('setzen Sie sich')
    expect(form('sein', 'imperativ', 'sie')).toBe('seien Sie')
    expect(form('lernen', 'imperativ', 'sie')).toBe('lernen Sie')
  })
})

describe('dataset integrity', () => {
  it('has unique ids', () => {
    const ids = VERBS.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('declares a Präteritum stem for every verb that is not weak', () => {
    for (const v of VERBS) {
      if (v.class === 'weak') continue
      expect(v.praet, v.id).toBeTruthy()
      expect(v.partizip2, v.id).toBeTruthy()
    }
  })

  it('produces a non-empty form for every verb, tense and person', () => {
    const tenses: Tense[] = [
      'praesens', 'praeteritum', 'perfekt', 'plusquamperfekt',
      'futur1', 'futur2', 'konjunktiv1', 'konjunktiv2', 'wuerde', 'imperativ',
    ]
    for (const v of VERBS) {
      for (const t of tenses) {
        for (const p of PERSONS) {
          const f = conjugate(v, t, p)
          expect(f.text.length, `${v.id} ${t} ${p}`).toBeGreaterThan(0)
          expect(f.text, `${v.id} ${t} ${p}`).not.toMatch(/undefined|NaN/)
        }
      }
    }
  })

  it('never leaves a separable prefix out of a finite form', () => {
    for (const v of VERBS) {
      if (!v.sep) continue
      expect(conjugate(v, 'praesens', 'ich').text.endsWith(v.sep), v.id).toBe(true)
      expect(partizip2(v).startsWith(v.sep), v.id).toBe(true)
    }
  })

  it('keeps the Präteritum stem out of the Konjunktiv II of strong verbs', () => {
    for (const v of VERBS) {
      if (v.class !== 'strong') continue
      expect(konj2Base(v).endsWith('e'), v.id).toBe(true)
      expect(konj2Base(v), v.id).not.toBe(praetBase(v))
    }
  })
})
