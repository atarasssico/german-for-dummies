// Turns the datasets into cards. Every card carries a stable id so scheduling
// tracks a skill ("Kind in the dative") rather than one particular rendering.

import { NOUNS, noun as nounById } from '@/data/nouns'
import { PREPOSITIONS, PREP_BY_ID, WECHSEL } from '@/data/prepositions'
import type { PrepGroup } from '@/data/prepositions'
import { VERBS, verb as verbById } from '@/data/verbs'
import { CONTRASTS, PATTERN_LABEL, VALENCY, VALENCY_BY_ID } from '@/data/valency'
import type { Frame, Pattern } from '@/data/valency'
import type { PersonKey, Tense, Verb } from './conjugate'
import {
  PERSON_LABEL, TENSE_HINT, TENSE_LABEL, conjugate, partizip2, personsFor, praetBase, prefersWuerde,
} from './conjugate'
import type { Adjective, Gender, Kasus, Level, Noun, Numerus } from './grammar'
import {
  KASUS, KASUS_LABEL, KASUS_QUESTION, adjEnding, adjPattern, availableDeterminers,
  determiner, determinerForm, nounForm, nounPhrase, slotOf,
} from './grammar'

export type Mode = 'articles' | 'verbs' | 'valency' | 'prepositions'

export const MODES: Mode[] = ['articles', 'verbs', 'valency', 'prepositions']

export const MODE_LABEL: Record<Mode, string> = {
  articles: 'Artikel & Kasus',
  verbs: 'Verben',
  valency: 'Verbkasus',
  prepositions: 'Präpositionen',
}

export const MODE_BLURB: Record<Mode, string> = {
  articles: 'Genders, and the four cases across every determiner and adjective ending.',
  verbs: 'Ten tenses, generated from principal parts. 90 of the verbs are strong or irregular.',
  valency: 'Which case a verb governs, its fixed prepositions, and how meaning shifts with the frame.',
  prepositions: 'Each preposition’s case, and the two-way ones that take both.',
}

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1']

export function withinLevel(level: Level, cap: Level): boolean {
  return LEVELS.indexOf(level) <= LEVELS.indexOf(cap)
}

export interface Choice {
  id: string
  label: string
  sub?: string
}

export type QuestionKind = 'type' | 'choice' | 'prep+case'

export interface Question {
  id: string
  mode: Mode
  kind: QuestionKind
  level: Level
  /** Small label above the question: the task. */
  lead: string
  /** The thing being asked about, shown large. */
  focus: string
  /** Gloss or extra framing under the focus. */
  sub?: string
  /** For cloze questions, the sentence with a gap already in it. */
  cloze?: string
  choices?: Choice[]
  answer: { text: string; alts: string[] }
  /** For 'prep+case': the case has to be right too. */
  prepAnswer?: { prep: string; kasus: Kasus }
  /** Shown after answering: the rule, then the evidence. */
  rules: string[]
  example?: { de: string; en: string }
  /** Free-standing caveat from the dataset. */
  note?: string
  /** Gender the prompt already gives away, so the rail and article can be coloured. */
  gender?: Gender
  /** The article shown ahead of the focus word, coloured by gender. */
  focusArticle?: string
  /** Gender that IS the answer, so it is only shown once the card is answered. */
  revealGender?: Gender
  /**
   * The task, spelled out. `target` is what you have to produce and gets the
   * largest type on the card, because the thing being asked should outrank the
   * thing being given.
   */
  target?: string
  /** Clarifier under the target, e.g. the case question word. */
  targetHint?: string
  /** What form the material is shown in, e.g. 'Nominativ' or 'Infinitiv'. */
  sourceLabel?: string
  /** Conditions on the answer, e.g. Singular, definite article, an adjective. */
  spec?: string[]
  /** What the answer has to contain, shown as the input's label. */
  expects?: string
}

export interface GenSettings {
  level: Level
  topics: string[]
  tenses: Tense[]
  determiners: string[]
  includeAdjectives: boolean
  usePlural: boolean
}

export const DEFAULT_SETTINGS: GenSettings = {
  level: 'B1',
  topics: [],
  tenses: ['praesens', 'praeteritum', 'perfekt'],
  determiners: ['def', 'indef', 'kein', 'dies', 'mein'],
  includeAdjectives: false,
  usePlural: true,
}

/** Deterministic PRNG so a card can be rebuilt identically from its id. */
export function rngFrom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)] as T
}

const ADJECTIVES: Adjective[] = [
  { word: 'gut', en: 'good' },
  { word: 'neu', en: 'new' },
  { word: 'alt', en: 'old' },
  { word: 'klein', en: 'small' },
  { word: 'groß', en: 'big' },
  { word: 'schön', en: 'beautiful' },
  { word: 'jung', en: 'young' },
  { word: 'kalt', en: 'cold' },
  { word: 'warm', en: 'warm' },
  { word: 'schnell', en: 'fast' },
  { word: 'interessant', en: 'interesting' },
  { word: 'schwer', en: 'difficult, heavy' },
  { word: 'teuer', stem: 'teur', en: 'expensive' },
  { word: 'hoch', stem: 'hoh', en: 'high' },
  { word: 'dunkel', stem: 'dunkl', en: 'dark' },
]

const ARTICLE_LABEL: Record<Gender, string> = { m: 'der', f: 'die', n: 'das' }

// ---------------------------------------------------------------------- pools

export function nounPool(s: GenSettings): Noun[] {
  return NOUNS.filter(
    (n) => withinLevel(n.level, s.level) && (s.topics.length === 0 || s.topics.includes(n.topic)),
  )
}

export function verbPool(s: GenSettings): Verb[] {
  return VERBS.filter((v) => withinLevel(v.level, s.level))
}

export function poolFor(mode: Mode, s: GenSettings): string[] {
  switch (mode) {
    case 'articles': {
      const nouns = nounPool(s)
      return [
        ...nouns.map((n) => `gender:${n.id}`),
        ...nouns.flatMap((n) => KASUS.map((k) => `decl:${n.id}:${k}`)),
      ]
    }
    case 'verbs': {
      const tenses = s.tenses.length ? s.tenses : DEFAULT_SETTINGS.tenses
      return verbPool(s).flatMap((v) =>
        tenses.flatMap((t) =>
          personsFor(t)
            .filter((p) => !v.only3rd || p === 'er')
            .map((p) => `conj:${v.id}:${t}:${p}`),
        ),
      )
    }
    case 'valency': {
      const ids: string[] = []
      for (const v of VALENCY) {
        if (!withinLevel(v.level, s.level)) continue
        v.frames.forEach((frame, i) => {
          ids.push(frame.pattern === 'prep' ? `valprep:${v.id}:${i}` : `valcase:${v.id}:${i}`)
          if (v.frames.length > 1) ids.push(`valsense:${v.id}:${i}`)
        })
      }
      return ids
    }
    case 'prepositions': {
      const preps = PREPOSITIONS.filter((p) => withinLevel(p.level, s.level))
      return [
        ...preps.map((p) => `prepgroup:${p.id}`),
        ...WECHSEL.filter((p) => withinLevel(p.level, s.level)).flatMap((p) => [
          `wechsel:${p.id}:akk`,
          `wechsel:${p.id}:dat`,
        ]),
      ]
    }
  }
}

// ------------------------------------------------------------------ explaining

/** How the determiner is described in a prompt, where the article is already visible. */
const DET_HINT: Record<string, string> = {
  def: 'bestimmter Artikel',
  indef: 'unbestimmter Artikel',
  kein: 'Negation mit kein',
  dies: 'dieser',
  jed: 'jeder',
  jen: 'jener',
  welch: 'welcher',
  manch: 'mancher',
  solch: 'solcher',
  all: 'alle',
  mein: 'Possessiv mein',
  dein: 'Possessiv dein',
  sein: 'Possessiv sein',
  ihr: 'Possessiv ihr',
  unser: 'Possessiv unser',
  euer: 'Possessiv euer',
  Ihr: 'Possessiv Ihr',
  none: 'ohne Artikel',
}

function determinerRule(det: string, slot: 'm' | 'f' | 'n' | 'pl', kasus: Kasus): string {
  const d = determiner(det)
  const form = determinerForm(d, slot, kasus)
  const nominative = determinerForm(d, slot, 'nom')
  const slotName = slot === 'pl' ? 'Plural' : slot === 'm' ? 'maskulin' : slot === 'f' ? 'feminin' : 'neutrum'
  if (!form) return 'No determiner, so the adjective carries the case ending itself.'
  if (kasus === 'nom') return `Nominativ ${slotName}: ${form}.`
  if (form === nominative) {
    return `${KASUS_LABEL[kasus]} ${slotName}: ${nominative} does not change.`
  }
  return `${KASUS_LABEL[kasus]} ${slotName}: ${nominative} → ${form}.`
}

function nounEndingRule(n: Noun, kasus: Kasus, num: Numerus): string | null {
  if (num === 'pl') {
    if (kasus === 'dat' && !/[ns]$/.test(n.plural)) {
      return `Dativ Plural adds -n to the plural: ${n.plural} → ${nounForm(n, 'dat', 'pl').form}.`
    }
    return null
  }
  if (n.oblique && kasus !== 'nom') {
    return `n-declension: ${ARTICLE_LABEL[n.gender]} ${n.word} takes -${n.oblique.slice(n.word.length) || 'n'} in every case but the nominative singular${n.genS ? ', plus -s in the genitive' : ''}.`
  }
  if (kasus === 'gen' && n.gender !== 'f') {
    return `Genitiv Singular: masculine and neuter nouns add -s or -es → ${nounForm(n, 'gen', 'sg').form}.`
  }
  return null
}

function adjectiveRule(det: string, slot: 'm' | 'f' | 'n' | 'pl', kasus: Kasus): string {
  const pattern = adjPattern(determiner(det))
  const ending = adjEnding(pattern, slot, kasus)
  const why = pattern === 'weak'
    ? 'after a der-type determiner the adjective is weak'
    : pattern === 'mixed'
      ? 'after an ein-type determiner the adjective is mixed'
      : 'with no determiner the adjective takes the strong ending itself'
  return `Adjective: ${why} → -${ending}.`
}

// --------------------------------------------------------------- constructors

function genderQuestion(n: Noun): Question {
  const rules = [
    `${ARTICLE_LABEL[n.gender]} ${n.word}${n.plural ? `, Plural: die ${n.plural}` : ', no plural'}`,
  ]
  if (n.hint) rules.push(n.hint)
  return {
    id: `gender:${n.id}`,
    mode: 'articles',
    kind: 'choice',
    level: n.level,
    lead: 'Genus bestimmen',
    sourceLabel: 'Substantiv',
    focus: n.word,
    sub: n.en,
    target: 'Welcher Artikel?',
    targetHint: 'der, die oder das',
    choices: [
      { id: 'm', label: 'der' },
      { id: 'f', label: 'die' },
      { id: 'n', label: 'das' },
    ],
    answer: { text: n.gender, alts: [] },
    rules,
    revealGender: n.gender,
  }
}

function declensionQuestion(n: Noun, kasus: Kasus, s: GenSettings, rand: () => number): Question {
  const wantsPlural = s.usePlural && n.plural !== '' && rand() < 0.35
  const num: Numerus = wantsPlural ? 'pl' : 'sg'
  const allowed = availableDeterminers(num).filter((d) => s.determiners.includes(d.id))
  const det = (allowed.length ? pick(allowed, rand) : determiner('def')).id
  const adj = s.includeAdjectives && rand() < 0.5 ? pick(ADJECTIVES, rand) : undefined
  const phrase = nounPhrase(n, { det, kasus, num, adj })
  const slot = slotOf(n, num)

  const rules = [determinerRule(det, slot, kasus)]
  if (adj) rules.push(adjectiveRule(det, slot, kasus))
  const ending = nounEndingRule(n, kasus, num)
  if (ending) rules.push(ending)

  return {
    id: `decl:${n.id}:${kasus}`,
    mode: 'articles',
    kind: 'type',
    level: n.level,
    lead: 'Wortgruppe umformen',
    focus: n.word,
    focusArticle: ARTICLE_LABEL[n.gender],
    gender: n.gender,
    sub: n.en,
    sourceLabel: 'Nominativ Singular',
    target: `${KASUS_LABEL[kasus]} ${num === 'pl' ? 'Plural' : 'Singular'}`,
    targetHint: KASUS_QUESTION[kasus],
    spec: [DET_HINT[det] ?? determiner(det).label, adj ? `Adjektiv: ${adj.word}` : null].filter(
      (item): item is string => Boolean(item),
    ),
    expects: adj ? 'Artikel + Adjektiv + Nomen' : 'Artikel + Nomen',
    answer: { text: phrase.text, alts: phrase.alts },
    rules,
    note: n.hint,
  }
}

function conjugationQuestion(v: Verb, tense: Tense, person: PersonKey): Question {
  const form = conjugate(v, tense, person)
  const rules: string[] = []
  if (v.class === 'weak') {
    rules.push(`${v.infinitive} is weak: regular endings all the way through.`)
  } else {
    rules.push(`${v.infinitive} · ${praetBase(v)} · ${v.aux === 'sein' ? 'ist' : 'hat'} ${partizip2(v)}`)
  }
  if (v.sep) rules.push(`Separable: the prefix ${v.sep}- goes to the end of the clause, and ge- slots in behind it in the participle.`)
  if (v.reflexive) rules.push(`Reflexive: the pronoun agrees with the subject (${v.reflexive === 'dat' ? 'dative' : 'accusative'}).`)
  if (v.aux === 'sein') rules.push('Takes sein in the compound tenses.')
  if (tense === 'konjunktiv2' && prefersWuerde(v)) {
    rules.push('Identical to the Präteritum, which is why speakers reach for würde + Infinitiv instead.')
  }
  rules.push(`${TENSE_LABEL[tense]}: ${TENSE_HINT[tense]}.`)

  return {
    id: `conj:${v.id}:${tense}:${person}`,
    mode: 'verbs',
    kind: 'type',
    level: v.level,
    lead: 'Verb konjugieren',
    focus: v.infinitive,
    sub: v.en,
    sourceLabel: 'Infinitiv',
    target: TENSE_LABEL[tense],
    targetHint:
      tense === 'imperativ'
        ? `Imperativ für ${person === 'sie' ? 'Sie' : person}`
        : PERSON_LABEL[person],
    spec: [
      v.class === 'weak' ? 'regelmäßig' : v.class === 'strong' ? 'starkes Verb' : v.class === 'modal' ? 'Modalverb' : 'unregelmäßig',
      v.sep ? `trennbar: ${v.sep}-` : null,
      v.reflexive ? 'reflexiv' : null,
    ].filter((item): item is string => Boolean(item)),
    expects: v.reflexive
      ? 'Verbform + Reflexivpronomen'
      : v.sep
        ? 'Verbform + Präfix am Ende'
        : 'nur die Verbform',
    answer: { text: form.text, alts: form.alts },
    rules,
    note: v.note,
  }
}

const PATTERN_CHOICES: Pattern[] = ['akk', 'dat', 'dat+akk', 'gen']

function valencyCaseQuestion(id: string, index: number): Question | null {
  const v = VALENCY_BY_ID.get(id)
  const frame = v?.frames[index]
  if (!v || !frame || frame.pattern === 'prep') return null
  const options = PATTERN_CHOICES.includes(frame.pattern)
    ? PATTERN_CHOICES
    : [...PATTERN_CHOICES, frame.pattern]
  return {
    id: `valcase:${id}:${index}`,
    mode: 'valency',
    kind: 'choice',
    level: v.level,
    lead: 'Welchen Kasus verlangt dieses Verb?',
    sourceLabel: 'Verb',
    focus: v.verb,
    sub: frame.sense ? `${v.en} · ${frame.sense}` : v.en,
    choices: options.map((p) => ({ id: p, label: PATTERN_LABEL[p] })),
    answer: { text: frame.pattern, alts: [] },
    rules: [`${v.verb} + ${PATTERN_LABEL[frame.pattern]}`],
    example: frame.example,
    note: v.note,
  }
}

function valencyPrepQuestion(id: string, index: number): Question | null {
  const v = VALENCY_BY_ID.get(id)
  const frame = v?.frames[index]
  if (!v || !frame || frame.pattern !== 'prep' || !frame.prep || !frame.prepCase) return null
  return {
    id: `valprep:${id}:${index}`,
    mode: 'valency',
    kind: 'prep+case',
    level: v.level,
    lead: 'Welche Präposition, und welchen Kasus verlangt sie?',
    sourceLabel: 'Verb',
    focus: v.verb,
    sub: frame.sense ? `${v.en} · ${frame.sense}` : v.en,
    answer: { text: `${frame.prep} + ${KASUS_LABEL[frame.prepCase]}`, alts: [] },
    prepAnswer: { prep: frame.prep, kasus: frame.prepCase },
    rules: [`${v.verb} ${frame.prep} + ${KASUS_LABEL[frame.prepCase]}`],
    example: frame.example,
    note: v.note,
  }
}

function frameLabel(frame: Frame): string {
  if (frame.pattern === 'prep' && frame.prep && frame.prepCase) {
    return `${frame.prep} + ${KASUS_LABEL[frame.prepCase]}`
  }
  return PATTERN_LABEL[frame.pattern]
}

function valencySenseQuestion(id: string, index: number): Question | null {
  const v = VALENCY_BY_ID.get(id)
  const frame = v?.frames[index]
  if (!v || !frame || v.frames.length < 2) return null
  return {
    id: `valsense:${id}:${index}`,
    mode: 'valency',
    kind: 'choice',
    level: v.level,
    lead: 'Welche Konstruktion trägt diese Bedeutung?',
    sourceLabel: 'Verb',
    focus: v.verb,
    sub: frame.sense ?? v.en,
    targetHint: frame.sense ? `Bedeutung: ${frame.sense}` : undefined,
    choices: v.frames.map((f, i) => ({ id: String(i), label: frameLabel(f), sub: f.sense })),
    answer: { text: String(index), alts: [] },
    rules: v.frames.map((f) => `${frameLabel(f)} · ${f.sense ?? v.en}`),
    example: frame.example,
    note: v.note,
  }
}

const GROUP_CHOICES: PrepGroup[] = ['akk', 'dat', 'gen', 'wechsel']

const GROUP_LABEL: Record<PrepGroup, string> = {
  akk: 'Akkusativ',
  dat: 'Dativ',
  gen: 'Genitiv',
  wechsel: 'Akkusativ or Dativ',
}

function prepGroupQuestion(id: string): Question | null {
  const p = PREP_BY_ID.get(id)
  if (!p) return null
  const rules = [`${p.word} + ${GROUP_LABEL[p.group]}`]
  if (p.wechsel) {
    rules.push(`Akkusativ = ${p.wechsel.akk}`)
    rules.push(`Dativ = ${p.wechsel.dat}`)
  }
  return {
    id: `prepgroup:${p.id}`,
    mode: 'prepositions',
    kind: 'choice',
    level: p.level,
    lead: 'Welcher Kasus folgt dieser Präposition?',
    sourceLabel: 'Präposition',
    focus: p.word,
    sub: p.en,
    choices: GROUP_CHOICES.map((g) => ({ id: g, label: GROUP_LABEL[g] })),
    answer: { text: p.group, alts: [] },
    rules,
    example: p.examples[0],
    note: p.note,
  }
}

/** Which position/movement verb pair reads naturally with each two-way preposition. */
const WECHSEL_FRAME: Record<string, { stat: string; dyn: string; subject: string; object: string }> = {
  an: { stat: 'hängt', dyn: 'hänge', subject: 'Das Bild', object: 'das Bild' },
  auf: { stat: 'liegt', dyn: 'lege', subject: 'Das Buch', object: 'das Buch' },
  in: { stat: 'liegt', dyn: 'lege', subject: 'Das Buch', object: 'das Buch' },
  hinter: { stat: 'steht', dyn: 'stelle', subject: 'Der Stuhl', object: 'den Stuhl' },
  neben: { stat: 'steht', dyn: 'stelle', subject: 'Der Stuhl', object: 'den Stuhl' },
  ueber: { stat: 'hängt', dyn: 'hänge', subject: 'Die Lampe', object: 'die Lampe' },
  unter: { stat: 'liegt', dyn: 'lege', subject: 'Die Tasche', object: 'die Tasche' },
  vor: { stat: 'steht', dyn: 'stelle', subject: 'Der Stuhl', object: 'den Stuhl' },
  zwischen: { stat: 'steht', dyn: 'stelle', subject: 'Der Stuhl', object: 'den Stuhl' },
}

function wechselQuestion(prepId: string, kasus: 'akk' | 'dat', rand: () => number, s: GenSettings): Question | null {
  const p = PREP_BY_ID.get(prepId)
  const frame = WECHSEL_FRAME[prepId]
  if (!p || !frame || !p.wechsel) return null

  // A concrete noun keeps the sentence plausible; abstract ones do not sit on tables.
  const candidates = nounPool(s).filter(
    (n) => ['home', 'city', 'food', 'nature', 'travel', 'study', 'tech'].includes(n.topic),
  )
  const target = candidates.length ? pick(candidates, rand) : nounById('tisch')
  const det = determinerForm(determiner('def'), target.gender, kasus)
  const tail = nounForm(target, kasus, 'sg').form
  const cloze = kasus === 'dat'
    ? `${frame.subject} ${frame.stat} ${p.word} ___ ${tail}.`
    : `Ich ${frame.dyn} ${frame.object} ${p.word} ___ ${tail}.`

  return {
    id: `wechsel:${p.id}:${kasus}`,
    mode: 'prepositions',
    kind: 'type',
    level: p.level,
    lead: 'Lücke füllen',
    focus: p.word,
    sub: p.en,
    target: kasus === 'dat' ? 'Wo? Position' : 'Wohin? Richtung',
    targetHint: `${p.word} + Akkusativ oder Dativ?`,
    expects: 'nur der bestimmte Artikel',
    cloze,
    answer: { text: det ?? '', alts: [] },
    rules: [
      `${p.word} takes the ${KASUS_LABEL[kasus]} here: ${kasus === 'akk' ? p.wechsel.akk : p.wechsel.dat}.`,
      `${KASUS_LABEL[kasus]} ${target.gender === 'm' ? 'maskulin' : target.gender === 'f' ? 'feminin' : 'neutrum'}: ${ARTICLE_LABEL[target.gender]} → ${det}.`,
    ],
    example: p.examples.find((e) => e.kasus === kasus) ?? p.examples[0],
    note: p.note,
  }
}

// ---------------------------------------------------------------------- build

/** Rebuilds a card from its id. Returns null when the id no longer resolves. */
export function buildQuestion(id: string, s: GenSettings = DEFAULT_SETTINGS): Question | null {
  const parts = id.split(':')
  const [kind] = parts
  const rand = rngFrom(id + Date.now().toString(36).slice(-3))
  try {
    switch (kind) {
      case 'gender':
        return genderQuestion(nounById(parts[1] as string))
      case 'decl':
        return declensionQuestion(nounById(parts[1] as string), parts[2] as Kasus, s, rand)
      case 'conj':
        return conjugationQuestion(verbById(parts[1] as string), parts[2] as Tense, parts[3] as PersonKey)
      case 'valcase':
        return valencyCaseQuestion(parts[1] as string, Number(parts[2]))
      case 'valprep':
        return valencyPrepQuestion(parts[1] as string, Number(parts[2]))
      case 'valsense':
        return valencySenseQuestion(parts[1] as string, Number(parts[2]))
      case 'prepgroup':
        return prepGroupQuestion(parts[1] as string)
      case 'wechsel':
        return wechselQuestion(parts[1] as string, parts[2] as 'akk' | 'dat', rand, s)
      default:
        return null
    }
  } catch {
    return null
  }
}

export function contrastCount(): number {
  return CONTRASTS.length
}
