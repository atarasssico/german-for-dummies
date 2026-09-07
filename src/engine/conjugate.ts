// Verb morphology. Each verb stores only its principal parts; every one of the
// ~60 forms per verb is generated from them, so the data files stay small and
// a single wrong stem is visible in one place.

import type { Level } from './grammar'

export type PersonKey = 'ich' | 'du' | 'er' | 'wir' | 'ihr' | 'sie'

export const PERSONS: PersonKey[] = ['ich', 'du', 'er', 'wir', 'ihr', 'sie']

export const PERSON_LABEL: Record<PersonKey, string> = {
  ich: 'ich',
  du: 'du',
  er: 'er/sie/es',
  wir: 'wir',
  ihr: 'ihr',
  sie: 'sie/Sie',
}

export type Tense =
  | 'praesens'
  | 'praeteritum'
  | 'perfekt'
  | 'plusquamperfekt'
  | 'futur1'
  | 'futur2'
  | 'konjunktiv1'
  | 'konjunktiv2'
  | 'wuerde'
  | 'imperativ'

export const TENSES: Tense[] = [
  'praesens',
  'praeteritum',
  'perfekt',
  'plusquamperfekt',
  'futur1',
  'futur2',
  'konjunktiv1',
  'konjunktiv2',
  'wuerde',
  'imperativ',
]

export const TENSE_LABEL: Record<Tense, string> = {
  praesens: 'Präsens',
  praeteritum: 'Präteritum',
  perfekt: 'Perfekt',
  plusquamperfekt: 'Plusquamperfekt',
  futur1: 'Futur I',
  futur2: 'Futur II',
  konjunktiv1: 'Konjunktiv I',
  konjunktiv2: 'Konjunktiv II',
  wuerde: 'würde-Form',
  imperativ: 'Imperativ',
}

export const TENSE_HINT: Record<Tense, string> = {
  praesens: 'now, and the future when context makes it clear',
  praeteritum: 'the written past, used in narrative and reports',
  perfekt: 'spoken past',
  plusquamperfekt: 'the past before the past',
  futur1: 'prediction and intention',
  futur2: 'will have done, and rare even in writing',
  konjunktiv1: 'reported speech',
  konjunktiv2: 'hypothetical and polite',
  wuerde: 'the everyday substitute for Konjunktiv II',
  imperativ: 'commands and requests',
}

export type VerbClass = 'weak' | 'strong' | 'mixed' | 'modal' | 'irregular'

export interface Verb {
  id: string
  /** Full infinitive including any separable prefix. */
  infinitive: string
  /** Separable prefix, e.g. 'an' in anrufen. */
  sep?: string
  /** Prefix that never separates and blocks ge- in the participle. */
  insep?: boolean
  reflexive?: 'akk' | 'dat'
  aux: 'haben' | 'sein'
  /** Some verbs take sein for motion and haben for the transitive reading. */
  auxAlt?: 'haben' | 'sein'
  class: VerbClass
  en: string
  level: Level
  /** 1st/3rd singular Präteritum, without the separable prefix. Derived for weak verbs. */
  praet?: string
  /** Partizip II without the separable prefix. Derived for weak verbs. */
  partizip2?: string
  /** 1st singular Konjunktiv II, without the prefix. Defaults to the Präteritum. */
  konj2?: string
  /** Imperative singular, without the prefix. */
  imperativSg?: string
  /** Präsens forms the rules cannot predict (stem-vowel change, modals). */
  present?: Partial<Record<PersonKey, string>>
  /** A second, equally correct Präteritum stem (senden: sandte / sendete). */
  praetAlt?: string
  /** A second, equally correct Partizip II (senden: gesandt / gesendet). */
  partizip2Alt?: string
  /** Impersonal verbs that only occur in the third person (geschehen, gelingen). */
  only3rd?: boolean
  /** Präteritum forms the rules cannot predict. */
  praetForms?: Partial<Record<PersonKey, string>>
  /** Konjunktiv I forms the rules cannot predict. */
  konj1Forms?: Partial<Record<PersonKey, string>>
  tags?: string[]
  note?: string
}

export interface Form {
  /** Canonical answer. */
  text: string
  /** Further spellings that are also correct. */
  alts: string[]
}

const INSEP_PREFIX = /^(be|emp|ent|er|ge|miss|ver|zer)/

const REFL: Record<'akk' | 'dat', Record<PersonKey, string>> = {
  akk: { ich: 'mich', du: 'dich', er: 'sich', wir: 'uns', ihr: 'euch', sie: 'sich' },
  dat: { ich: 'mir', du: 'dir', er: 'sich', wir: 'uns', ihr: 'euch', sie: 'sich' },
}

/** Infinitive with the separable prefix stripped off. */
function baseInfinitive(v: Verb): string {
  return v.sep ? v.infinitive.slice(v.sep.length) : v.infinitive
}

type StemShape = 'eln' | 'ern' | 'plain'

function shapeOf(inf: string): StemShape {
  if (/eln$/.test(inf)) return 'eln'
  if (/ern$/.test(inf)) return 'ern'
  return 'plain'
}

export function stemOf(inf: string): string {
  const shape = shapeOf(inf)
  if (shape !== 'plain') return inf.slice(0, -1)
  if (inf.endsWith('en')) return inf.slice(0, -2)
  if (inf.endsWith('n')) return inf.slice(0, -1)
  return inf
}

/**
 * Stems ending in -d/-t, or in -m/-n after an obstruent, take a linking -e-:
 * arbeiten -> du arbeitest, atmen -> du atmest, rechnen -> du rechnest.
 * Not after a vowel, a liquid or a nasal: lernen -> du lernst, kommen -> du kommst.
 * A lengthening -h- does not count as a consonant (wohnen -> du wohnst) but the
 * -h- of the digraph -ch- does (rechnen -> du rechnest).
 */
function needsE(stem: string): boolean {
  if (/[dt]$/.test(stem)) return true
  if (!/[mn]$/.test(stem)) return false
  const before = stem.slice(0, -1)
  const last = before.slice(-1).toLowerCase()
  if (!last) return false
  if ('aeiouäöüy'.includes(last)) return false
  if ('lrmn'.includes(last)) return false
  if (last === 'h') return before.toLowerCase().endsWith('ch')
  return true
}

/** Stems ending in a sibilant merge the -s- of the du ending. */
function isSibilant(stem: string): boolean {
  return /(?:ss|ß|s|z|tz|x)$/.test(stem) && !/sch$/.test(stem)
}

/** The ich form of -eln verbs drops the stem -e-: sammel + e -> sammle. */
function ichStem(stem: string, shape: StemShape): string {
  return shape === 'eln' ? stem.slice(0, -2) + 'l' : stem
}

function presentDefault(v: Verb, p: PersonKey): Form {
  const inf = baseInfinitive(v)
  const shape = shapeOf(inf)
  const stem = stemOf(inf)
  const e = needsE(stem)
  switch (p) {
    case 'ich':
      return one(ichStem(stem, shape) + 'e')
    case 'du':
      return one(e ? stem + 'est' : isSibilant(stem) ? stem + 't' : stem + 'st')
    case 'er':
    case 'ihr':
      return one(e ? stem + 'et' : stem + 't')
    case 'wir':
    case 'sie':
      return one(shape === 'plain' ? stem + 'en' : inf)
  }
}

function one(text: string, ...alts: string[]): Form {
  return { text, alts }
}

/** Präteritum stem: strong verbs declare it, weak verbs derive stem + -(e)te. */
export function praetBase(v: Verb): string {
  if (v.praet) return v.praet
  const stem = stemOf(baseInfinitive(v))
  return needsE(stem) ? stem + 'ete' : stem + 'te'
}

/**
 * Past-tense endings. A base ending in -e is already a full 1sg form
 * (lernte, brachte, wurde) and takes the short set; a bare strong stem
 * (gab, ging) takes the long set.
 */
function pastForm(base: string, p: PersonKey): Form {
  if (base.endsWith('e')) {
    switch (p) {
      case 'ich':
      case 'er':
        return one(base)
      case 'du':
        return one(base + 'st')
      case 'ihr':
        return one(base + 't')
      default:
        return one(base + 'n')
    }
  }
  switch (p) {
    case 'ich':
    case 'er':
      return one(base)
    case 'du':
      if (/[dt]$/.test(base)) return one(base + 'est', base + 'st')
      if (/(?:ß|s|z|x)$/.test(base)) return one(base + 'est', base + 't')
      return one(base + 'st')
    case 'ihr':
      return one(/[dt]$/.test(base) ? base + 'et' : base + 't')
    default:
      return one(base + 'en')
  }
}

const UMLAUT: Record<string, string> = { a: 'ä', o: 'ö', u: 'ü', au: 'äu' }

/** Umlauts the last umlautable vowel of a stem: gab -> gäb, zog -> zög, fuhr -> führ. */
function umlaut(stem: string): string {
  return stem.replace(/(au|a|o|u)(?=[^aou]*$)/, (m) => UMLAUT[m] ?? m)
}

/**
 * Konjunktiv II base (1sg). Weak verbs are identical to the Präteritum, which is
 * why the würde-form exists. Strong verbs umlaut the Präteritum stem and add -e;
 * the verbs where that rule gives the wrong vowel (werfen -> würfe, not wärfe)
 * declare `konj2` themselves.
 */
export function konj2Base(v: Verb): string {
  if (v.konj2) return v.konj2
  const base = praetBase(v)
  return base.endsWith('e') ? base : umlaut(base) + 'e'
}

/** Konjunktiv II keeps the -st/-t endings but may contract in strong verbs. */
function konj2Form(base: string, p: PersonKey, contract: boolean): Form {
  const short = base.slice(0, -1)
  switch (p) {
    case 'ich':
    case 'er':
      return one(base)
    case 'du':
      return contract ? one(base + 'st', short + 'st') : one(base + 'st')
    case 'ihr':
      return contract ? one(base + 't', short + 't') : one(base + 't')
    default:
      return one(base + 'n')
  }
}

export function partizip2(v: Verb): string {
  if (v.partizip2) return (v.sep ?? '') + v.partizip2
  const inf = baseInfinitive(v)
  const stem = stemOf(inf)
  const core = needsE(stem) ? stem + 'et' : stem + 't'
  const noGe = v.insep || INSEP_PREFIX.test(inf) || /ieren$/.test(inf)
  return (v.sep ?? '') + (noGe ? core : 'ge' + core)
}

export function partizip1(v: Verb): string {
  return v.infinitive + 'd'
}

export function zuInfinitive(v: Verb): string {
  return v.sep ? v.sep + 'zu' + baseInfinitive(v) : 'zu ' + v.infinitive
}

const HABEN: Verb = {
  id: 'haben',
  infinitive: 'haben',
  aux: 'haben',
  class: 'irregular',
  en: 'to have',
  level: 'A1',
  present: { du: 'hast', er: 'hat' },
  praet: 'hatte',
  partizip2: 'gehabt',
  konj2: 'hätte',
  imperativSg: 'hab',
}

const SEIN: Verb = {
  id: 'sein',
  infinitive: 'sein',
  aux: 'sein',
  class: 'irregular',
  en: 'to be',
  level: 'A1',
  present: { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', sie: 'sind' },
  praet: 'war',
  partizip2: 'gewesen',
  konj2: 'wäre',
  imperativSg: 'sei',
  konj1Forms: { ich: 'sei', du: 'seist', er: 'sei', wir: 'seien', ihr: 'seiet', sie: 'seien' },
}

const WERDEN: Verb = {
  id: 'werden',
  infinitive: 'werden',
  aux: 'sein',
  class: 'irregular',
  en: 'to become',
  level: 'A1',
  present: { du: 'wirst', er: 'wird' },
  praet: 'wurde',
  partizip2: 'geworden',
  konj2: 'würde',
  imperativSg: 'werde',
}

/** Auxiliaries have to conjugate without recursing into the composite tenses. */
function simple(v: Verb, tense: 'praesens' | 'praeteritum' | 'konjunktiv2', p: PersonKey): Form {
  if (tense === 'praesens') {
    const override = v.present?.[p]
    return override ? one(override) : presentDefault(v, p)
  }
  if (tense === 'praeteritum') {
    const override = v.praetForms?.[p]
    return override ? one(override) : pastForm(praetBase(v), p)
  }
  return konj2Form(konj2Base(v), p, v.class === 'strong' || v.id === 'sein')
}

function auxOf(v: Verb): Verb {
  return v.aux === 'sein' ? SEIN : HABEN
}

function clauseFor(v: Verb, p: PersonKey, finite: Form, tail: string[]): Form {
  const refl = v.reflexive ? [REFL[v.reflexive][p]] : []
  const build = (f: string) => [f, ...refl, ...tail].filter(Boolean).join(' ')
  return { text: build(finite.text), alts: finite.alts.map(build) }
}

/** First form wins as the canonical answer; the rest become accepted variants. */
function merge(primary: Form, ...others: Form[]): Form {
  const alts = new Set(primary.alts)
  for (const other of others) {
    alts.add(other.text)
    for (const a of other.alts) alts.add(a)
  }
  alts.delete(primary.text)
  return { text: primary.text, alts: [...alts] }
}

export function conjugate(v: Verb, tense: Tense, p: PersonKey): Form {
  const aux = auxOf(v)
  const auxAlt = v.auxAlt === 'sein' ? SEIN : v.auxAlt === 'haben' ? HABEN : null
  const p2 = partizip2(v)
  const p2Alt = v.partizip2Alt ? (v.sep ?? '') + v.partizip2Alt : null
  const particle = v.sep ? [v.sep] : []

  switch (tense) {
    case 'praesens': {
      const override = v.present?.[p]
      const finite = override ? one(override) : presentDefault(v, p)
      return clauseFor(v, p, finite, particle)
    }
    case 'praeteritum': {
      const override = v.praetForms?.[p]
      const finite = override ? one(override) : pastForm(praetBase(v), p)
      const main = clauseFor(v, p, finite, particle)
      if (override || !v.praetAlt) return main
      return merge(main, clauseFor(v, p, pastForm(v.praetAlt, p), particle))
    }
    case 'konjunktiv1': {
      const override = v.konj1Forms?.[p]
      const finite = override ? one(override) : konj1Default(v, p)
      return clauseFor(v, p, finite, particle)
    }
    case 'konjunktiv2': {
      const finite = konj2Form(konj2Base(v), p, v.class === 'strong' || v.id === 'sein')
      return clauseFor(v, p, finite, particle)
    }
    case 'wuerde':
      return clauseFor(v, p, simple(WERDEN, 'konjunktiv2', p), [v.infinitive])
    case 'perfekt':
      return compound(v, p, 'praesens', aux, auxAlt, p2, p2Alt)
    case 'plusquamperfekt':
      return compound(v, p, 'praeteritum', aux, auxAlt, p2, p2Alt)
    case 'futur1':
      return clauseFor(v, p, simple(WERDEN, 'praesens', p), [v.infinitive])
    case 'futur2': {
      const werden = simple(WERDEN, 'praesens', p)
      const primary = clauseFor(v, p, werden, [p2, aux.infinitive])
      const others: Form[] = []
      if (p2Alt) others.push(clauseFor(v, p, werden, [p2Alt, aux.infinitive]))
      if (auxAlt) others.push(clauseFor(v, p, werden, [p2, auxAlt.infinitive]))
      return merge(primary, ...others)
    }
    case 'imperativ':
      return imperative(v, p)
  }
}

/** Perfekt and Plusquamperfekt differ only in the tense of the auxiliary. */
function compound(
  v: Verb,
  p: PersonKey,
  auxTense: 'praesens' | 'praeteritum',
  aux: Verb,
  auxAlt: Verb | null,
  p2: string,
  p2Alt: string | null,
): Form {
  const primary = clauseFor(v, p, simple(aux, auxTense, p), [p2])
  const others: Form[] = []
  if (p2Alt) others.push(clauseFor(v, p, simple(aux, auxTense, p), [p2Alt]))
  if (auxAlt) {
    others.push(clauseFor(v, p, simple(auxAlt, auxTense, p), [p2]))
    if (p2Alt) others.push(clauseFor(v, p, simple(auxAlt, auxTense, p), [p2Alt]))
  }
  return merge(primary, ...others)
}

function konj1Default(v: Verb, p: PersonKey): Form {
  const stem = stemOf(baseInfinitive(v))
  switch (p) {
    case 'ich':
    case 'er':
      return one(stem + 'e')
    case 'du':
      return one(stem + 'est')
    case 'ihr':
      return one(stem + 'et')
    default:
      return one(stem + 'en')
  }
}

/** Only du, ihr and Sie have real imperatives; wir is the adhortative. */
export const IMPERATIV_PERSONS: PersonKey[] = ['du', 'ihr', 'sie']

export const IMPERATIV_LABEL: Record<string, string> = {
  du: 'du',
  ihr: 'ihr',
  sie: 'Sie',
  wir: 'wir',
}

function imperative(v: Verb, p: PersonKey): Form {
  const inf = baseInfinitive(v)
  const shape = shapeOf(inf)
  const stem = stemOf(inf)
  const tail = v.sep ? [v.sep] : []
  const refl = v.reflexive ? REFL[v.reflexive] : null

  if (p === 'du') {
    let text: string
    let alts: string[] = []
    if (v.imperativSg) {
      text = v.imperativSg
    } else if (shape !== 'plain') {
      text = ichStem(stem, shape) + 'e'
    } else if (needsE(stem) || /ig$/.test(stem)) {
      text = stem + 'e'
    } else {
      text = stem
      alts = [stem + 'e']
    }
    const build = (f: string) => [f, refl ? refl.du : '', ...tail].filter(Boolean).join(' ')
    return { text: build(text), alts: alts.map(build) }
  }
  if (p === 'ihr') {
    const finite = v.present?.ihr ?? presentDefault(v, 'ihr').text
    return one([finite, refl ? refl.ihr : '', ...tail].filter(Boolean).join(' '))
  }
  if (p === 'wir') {
    const finite = v.present?.wir ?? presentDefault(v, 'wir').text
    return one([finite, 'wir', refl ? refl.wir : '', ...tail].filter(Boolean).join(' '))
  }
  // The Sie-imperative is the 3rd plural present, which equals the infinitive for
  // every verb but sein (seien Sie). A separable prefix still goes to the end.
  const polite = v.konj1Forms?.sie ?? inf
  return one([polite, 'Sie', refl ? refl.sie : '', ...tail].filter(Boolean).join(' '))
}

export function personsFor(tense: Tense): PersonKey[] {
  return tense === 'imperativ' ? IMPERATIV_PERSONS : PERSONS
}

export function paradigm(v: Verb, tense: Tense): Array<{ person: PersonKey; form: Form }> {
  return personsFor(tense).map((person) => ({ person, form: conjugate(v, tense, person) }))
}

/** When Konjunktiv II collides with the Präteritum, speakers use würde instead. */
export function prefersWuerde(v: Verb): boolean {
  return konj2Base(v) === praetBase(v)
}

