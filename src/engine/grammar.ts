// Nominal morphology: determiners, adjective endings, noun declension.
// Everything here is derived from rules so the data files stay small and checkable.

export type Gender = 'm' | 'f' | 'n'
export type Kasus = 'nom' | 'akk' | 'dat' | 'gen'
export type Numerus = 'sg' | 'pl'
/** Declension slot: three genders in the singular collapse to one plural paradigm. */
export type Slot = Gender | 'pl'

export const KASUS: Kasus[] = ['nom', 'akk', 'dat', 'gen']

export const KASUS_LABEL: Record<Kasus, string> = {
  nom: 'Nominativ',
  akk: 'Akkusativ',
  dat: 'Dativ',
  gen: 'Genitiv',
}

export const KASUS_QUESTION: Record<Kasus, string> = {
  nom: 'wer? was?',
  akk: 'wen? was?',
  dat: 'wem?',
  gen: 'wessen?',
}

export const GENDER_LABEL: Record<Gender, string> = {
  m: 'maskulin',
  f: 'feminin',
  n: 'neutrum',
}

type Table = Record<Slot, Record<Kasus, string>>

const DEFINITE: Table = {
  m: { nom: 'der', akk: 'den', dat: 'dem', gen: 'des' },
  f: { nom: 'die', akk: 'die', dat: 'der', gen: 'der' },
  n: { nom: 'das', akk: 'das', dat: 'dem', gen: 'des' },
  pl: { nom: 'die', akk: 'die', dat: 'den', gen: 'der' },
}

/** dieser, jeder, welcher and friends carry the strong ending themselves. */
const DER_ENDING: Table = {
  m: { nom: 'er', akk: 'en', dat: 'em', gen: 'es' },
  f: { nom: 'e', akk: 'e', dat: 'er', gen: 'er' },
  n: { nom: 'es', akk: 'es', dat: 'em', gen: 'es' },
  pl: { nom: 'e', akk: 'e', dat: 'en', gen: 'er' },
}

/** ein, kein, mein: three endingless slots (m nom, n nom, n akk). */
const EIN_ENDING: Table = {
  m: { nom: '', akk: 'en', dat: 'em', gen: 'es' },
  f: { nom: 'e', akk: 'e', dat: 'er', gen: 'er' },
  n: { nom: '', akk: '', dat: 'em', gen: 'es' },
  pl: { nom: 'e', akk: 'e', dat: 'en', gen: 'er' },
}

const ADJ_WEAK: Table = {
  m: { nom: 'e', akk: 'en', dat: 'en', gen: 'en' },
  f: { nom: 'e', akk: 'e', dat: 'en', gen: 'en' },
  n: { nom: 'e', akk: 'e', dat: 'en', gen: 'en' },
  pl: { nom: 'en', akk: 'en', dat: 'en', gen: 'en' },
}

const ADJ_MIXED: Table = {
  m: { nom: 'er', akk: 'en', dat: 'en', gen: 'en' },
  f: { nom: 'e', akk: 'e', dat: 'en', gen: 'en' },
  n: { nom: 'es', akk: 'es', dat: 'en', gen: 'en' },
  pl: { nom: 'en', akk: 'en', dat: 'en', gen: 'en' },
}

const ADJ_STRONG: Table = {
  m: { nom: 'er', akk: 'en', dat: 'em', gen: 'en' },
  f: { nom: 'e', akk: 'e', dat: 'er', gen: 'er' },
  n: { nom: 'es', akk: 'es', dat: 'em', gen: 'en' },
  pl: { nom: 'e', akk: 'e', dat: 'en', gen: 'er' },
}

export type DetType = 'der' | 'ein' | 'none'
export type AdjPattern = 'weak' | 'mixed' | 'strong'

export interface Determiner {
  id: string
  /** Dictionary form shown in the UI. */
  label: string
  type: DetType
  /** Stem the ending attaches to. Unused for the definite article. */
  stem?: string
  /** Some determiners exist only in the singular (ein) or only in the plural (beide). */
  only?: Numerus
}

export const DETERMINERS: Determiner[] = [
  { id: 'def', label: 'der/die/das', type: 'der' },
  { id: 'indef', label: 'ein', type: 'ein', stem: 'ein', only: 'sg' },
  { id: 'kein', label: 'kein', type: 'ein', stem: 'kein' },
  { id: 'dies', label: 'dieser', type: 'der', stem: 'dies' },
  { id: 'jed', label: 'jeder', type: 'der', stem: 'jed', only: 'sg' },
  { id: 'jen', label: 'jener', type: 'der', stem: 'jen' },
  { id: 'welch', label: 'welcher', type: 'der', stem: 'welch' },
  { id: 'manch', label: 'mancher', type: 'der', stem: 'manch' },
  { id: 'solch', label: 'solcher', type: 'der', stem: 'solch' },
  { id: 'all', label: 'alle', type: 'der', stem: 'all', only: 'pl' },
  { id: 'mein', label: 'mein', type: 'ein', stem: 'mein' },
  { id: 'dein', label: 'dein', type: 'ein', stem: 'dein' },
  { id: 'sein', label: 'sein', type: 'ein', stem: 'sein' },
  { id: 'ihr', label: 'ihr', type: 'ein', stem: 'ihr' },
  { id: 'unser', label: 'unser', type: 'ein', stem: 'unser' },
  { id: 'euer', label: 'euer', type: 'ein', stem: 'euer' },
  { id: 'Ihr', label: 'Ihr (formal)', type: 'ein', stem: 'Ihr' },
  { id: 'none', label: 'ohne Artikel', type: 'none' },
]

const DET_BY_ID = new Map(DETERMINERS.map((d) => [d.id, d]))

export function determiner(id: string): Determiner {
  const d = DET_BY_ID.get(id)
  if (!d) throw new Error(`unknown determiner: ${id}`)
  return d
}

/** euer loses its stem -e- as soon as an ending follows: euer -> eure, euren, eurem. */
function joinEin(stem: string, ending: string): string {
  if (!ending) return stem
  if (stem.endsWith('euer')) return stem.slice(0, -2) + 'r' + ending
  return stem + ending
}

export function determinerForm(det: Determiner, slot: Slot, kasus: Kasus): string | null {
  if (det.type === 'none') return null
  if (det.id === 'def') return DEFINITE[slot][kasus]
  const stem = det.stem ?? ''
  if (det.type === 'der') return stem + DER_ENDING[slot][kasus]
  return joinEin(stem, EIN_ENDING[slot][kasus])
}

export function adjPattern(det: Determiner): AdjPattern {
  if (det.type === 'der') return 'weak'
  if (det.type === 'ein') return 'mixed'
  return 'strong'
}

export function adjEnding(pattern: AdjPattern, slot: Slot, kasus: Kasus): string {
  const table = pattern === 'weak' ? ADJ_WEAK : pattern === 'mixed' ? ADJ_MIXED : ADJ_STRONG
  return table[slot][kasus]
}

export interface Adjective {
  word: string
  /** Stem used before an ending, when it differs: teuer -> teur, hoch -> hoh. */
  stem?: string
  en: string
}

export function adjectiveForm(adj: Adjective, pattern: AdjPattern, slot: Slot, kasus: Kasus): string {
  const ending = adjEnding(pattern, slot, kasus)
  if (!ending) return adj.word
  return (adj.stem ?? adj.word) + ending
}

export interface Noun {
  id: string
  /** Nominative singular, capitalised, without article. */
  word: string
  gender: Gender
  /** Nominative plural. Empty string for nouns without a usable plural. */
  plural: string
  /** Genitive singular, when the rule below would get it wrong. */
  gen?: string
  /** n-declension (weak masculine): der Junge -> den Jungen. */
  oblique?: string
  /** Name-type: oblique + s in the genitive (des Namens, des Herzens). */
  genS?: boolean
  en: string
  topic: string
  /** Why this gender is what it is, when a rule explains it. */
  hint?: string
  level: Level
}

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

function vowelGroups(word: string): number {
  return word.toLowerCase().match(/[aeiouäöüy]+/g)?.length ?? 0
}

/** Genitive singular of a masculine or neuter noun. */
export function genitiveSg(noun: Noun): { form: string; alts: string[] } {
  if (noun.gen) return { form: noun.gen, alts: [] }
  if (noun.gender === 'f') return { form: noun.word, alts: [] }
  if (noun.oblique) {
    const base = noun.oblique
    return noun.genS ? { form: base + 's', alts: [] } : { form: base, alts: [] }
  }
  const w = noun.word
  if (/nis$/.test(w)) return { form: w + 'ses', alts: [] }
  if (/(s|ß|x|z|sch|tsch)$/.test(w)) return { form: w + 'es', alts: [] }
  if (/([aeiouäöü]|[aeiouäöü]h)$/.test(w)) return { form: w + 's', alts: [] }
  if (/(el|er|en|chen|lein|ling|ismus)$/.test(w)) return { form: w + 's', alts: [] }
  // Monosyllables prefer -es (des Kindes); longer stems take -s. Both are accepted.
  return vowelGroups(w) <= 1 ? { form: w + 'es', alts: [w + 's'] } : { form: w + 's', alts: [w + 'es'] }
}

/** Dative plural adds -n unless the plural already ends in -n or -s. */
export function dativePl(plural: string): string {
  return /[ns]$/.test(plural) ? plural : plural + 'n'
}

export function nounForm(noun: Noun, kasus: Kasus, num: Numerus): { form: string; alts: string[] } {
  if (num === 'pl') {
    if (!noun.plural) throw new Error(`${noun.word} has no plural`)
    return { form: kasus === 'dat' ? dativePl(noun.plural) : noun.plural, alts: [] }
  }
  if (kasus === 'gen') return genitiveSg(noun)
  if (kasus === 'nom') return { form: noun.word, alts: [] }
  // Weak masculines take the oblique form in the accusative and dative.
  if (noun.oblique) return { form: noun.oblique, alts: [] }
  return { form: noun.word, alts: [] }
}

export function slotOf(noun: Noun, num: Numerus): Slot {
  return num === 'pl' ? 'pl' : noun.gender
}

export interface PhraseOptions {
  det: string
  adj?: Adjective
  kasus: Kasus
  num: Numerus
}

export interface Phrase {
  /** Canonical rendering, e.g. "dem kleinen Kind". */
  text: string
  /** Other renderings that are also correct (genitive -s/-es doublets). */
  alts: string[]
  det: string | null
  adjective: string | null
  noun: string
  slot: Slot
  kasus: Kasus
  num: Numerus
}

export function nounPhrase(noun: Noun, opts: PhraseOptions): Phrase {
  const det = determiner(opts.det)
  const slot = slotOf(noun, opts.num)
  const detForm = determinerForm(det, slot, opts.kasus)
  const adjForm = opts.adj ? adjectiveForm(opts.adj, adjPattern(det), slot, opts.kasus) : null
  const n = nounForm(noun, opts.kasus, opts.num)
  const build = (nounWord: string) => [detForm, adjForm, nounWord].filter(Boolean).join(' ')
  return {
    text: build(n.form),
    alts: n.alts.map(build),
    det: detForm,
    adjective: adjForm,
    noun: n.form,
    slot,
    kasus: opts.kasus,
    num: opts.num,
  }
}

/** Determiners a given noun/number combination can actually take. */
export function availableDeterminers(num: Numerus): Determiner[] {
  return DETERMINERS.filter((d) => !d.only || d.only === num)
}

/**
 * Preposition + definite article contractions. The first group is obligatory in
 * standard written German, the second is normal in speech but optional.
 */
const CONTRACTIONS_REQUIRED: Record<string, string> = {
  'an dem': 'am',
  'an das': 'ans',
  'in dem': 'im',
  'in das': 'ins',
  'zu dem': 'zum',
  'zu der': 'zur',
  'bei dem': 'beim',
  'von dem': 'vom',
}

const CONTRACTIONS_OPTIONAL: Record<string, string> = {
  'auf das': 'aufs',
  'für das': 'fürs',
  'um das': 'ums',
  'durch das': 'durchs',
  'über das': 'übers',
  'über dem': 'überm',
  'unter das': 'unters',
  'unter dem': 'unterm',
  'vor das': 'vors',
  'vor dem': 'vorm',
  'hinter das': 'hinters',
  'hinter dem': 'hinterm',
}

/**
 * Applies a preposition to a phrase. Returns the canonical rendering first and
 * the other correct rendering (contracted or not) as an alternative.
 */
export function withPreposition(prep: string, phrase: Phrase): { text: string; alts: string[] } {
  const plain = `${prep} ${phrase.text}`
  const alts = new Set(phrase.alts.map((a) => `${prep} ${a}`))
  if (!phrase.det) return { text: plain, alts: [...alts] }

  const key = `${prep} ${phrase.det}`
  const rest = phrase.text.slice(phrase.det.length).trimStart()
  const required = CONTRACTIONS_REQUIRED[key]
  if (required) {
    alts.add(plain)
    return { text: [required, rest].filter(Boolean).join(' '), alts: [...alts] }
  }
  const optional = CONTRACTIONS_OPTIONAL[key]
  if (optional) alts.add([optional, rest].filter(Boolean).join(' '))
  return { text: plain, alts: [...alts] }
}
