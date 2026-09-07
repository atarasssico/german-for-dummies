import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenderChip, GenderKey, Rail } from '@/components/Rail'
import { LedgerHead } from '@/components/Ledger'
import { PrincipalParts } from '@/routes/Paradigm'
import { KasusPill, VerbFramesInline, pillsOf } from '@/components/VerbFrames'
import { NOUNS, noun as nounById } from '@/data/nouns'
import { PREPOSITIONS, PREP_GROUP_LABEL } from '@/data/prepositions'
import type { PrepGroup } from '@/data/prepositions'
import { POSITION_PAIRS, VALENCY } from '@/data/valency'
import type { Valency } from '@/data/valency'
import { VERBS } from '@/data/verbs'
import type { Gender, Kasus, Level, Numerus, Slot } from '@/engine/grammar'
import {
  KASUS, KASUS_LABEL, KASUS_QUESTION, adjEnding, determiner, determinerForm, nounForm, nounPhrase,
} from '@/engine/grammar'
import { withinLevel } from '@/engine/questions'
import { GENDER_FILL, GENDER_ON, GENDER_VAR, genderTint } from '@/lib/gender'
import { GROUP_KASUS, KASUS_FILL, KASUS_ON, KASUS_VAR, kasusTint } from '@/lib/kasus'
import { KasusBar, KasusName } from '@/components/KasusLabel'
import { cn } from '@/lib/utils'

const SLOTS: Slot[] = ['m', 'f', 'n', 'pl']

const SLOT_HEAD: Record<Slot, { label: string; colour?: string; gender?: Gender }> = {
  m: { label: 'maskulin', colour: GENDER_VAR.m, gender: 'm' },
  f: { label: 'feminin', colour: GENDER_VAR.f, gender: 'f' },
  n: { label: 'neutrum', colour: GENDER_VAR.n, gender: 'n' },
  pl: { label: 'Plural' },
}

const TABS = ['deklination', 'verben', 'praepositionen', 'verbkasus'] as const

export function Reference() {
  // The open table lives in the URL, so a specific table can be bookmarked
  // and the back button steps between them.
  const [params, setParams] = useSearchParams()
  const requested = params.get('tabelle')
  const active = TABS.includes(requested as (typeof TABS)[number]) ? requested! : 'deklination'

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={active}
        onValueChange={(value) => setParams({ tabelle: value }, { replace: true })}
        className="gap-6"
      >
        <div className="-mx-5 overflow-x-auto px-5">
          <TabsList className="h-auto w-max gap-1 rounded-none bg-transparent p-0">
            {[
              ['deklination', 'Deklination'],
              ['verben', 'Verben'],
              ['praepositionen', 'Präpositionen'],
              ['verbkasus', 'Verbkasus'],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="shrink-0 rounded-none border-0 border-b-[1.5px] border-transparent px-3 py-2 text-[16px] tracking-wide text-foreground-soft shadow-none data-[state=active]:border-rule-strong data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="deklination" className="flex flex-col gap-10">
          <DeterminerTables />
          <AdjectiveTables />
          <NounLookup />
        </TabsContent>

        <TabsContent value="verben">
          <VerbList />
        </TabsContent>

        <TabsContent value="praepositionen">
          <PrepositionList />
        </TabsContent>

        <TabsContent value="verbkasus">
          <ValencyList />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ------------------------------------------------------------------ tables */

function GridTable({
  caption,
  rows,
}: {
  caption: string
  rows: Array<{ head: string; sub?: string; kasus?: Kasus; cells: Array<string | null> }>
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-[1.5px] border-rule-strong">
            <th scope="col" className="w-[7.5rem] pb-2 pr-3 text-[15px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Kasus
            </th>
            {SLOTS.map((slot) => (
              <th
                key={slot}
                scope="col"
                className="px-2 py-1.5 text-[15px] font-semibold uppercase tracking-[0.08em]"
                style={
                  SLOT_HEAD[slot].gender
                    ? {
                        background: GENDER_FILL[SLOT_HEAD[slot].gender as Gender],
                        color: GENDER_ON[SLOT_HEAD[slot].gender as Gender],
                      }
                    : { color: 'var(--muted-foreground)' }
                }
              >
                {SLOT_HEAD[slot].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.head} className="border-b border-rule">
              <th
                scope="row"
                className="px-2 py-2 align-middle"
                style={row.kasus ? { background: KASUS_FILL[row.kasus], color: KASUS_ON[row.kasus] } : undefined}
              >
                <span className="block text-[16px] font-semibold">{row.head}</span>
                {row.sub && <span className="block text-[15px] opacity-80">{row.sub}</span>}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className="de px-2 py-2.5 align-baseline text-[18px]"
                  style={{
                    color: SLOT_HEAD[SLOTS[i] as Slot].colour,
                    background: SLOT_HEAD[SLOTS[i] as Slot].gender
                      ? genderTint(SLOT_HEAD[SLOTS[i] as Slot].gender, 5)
                      : undefined,
                  }}
                >
                  {cell ?? '·'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const DET_SETS = [
  { id: 'def', title: 'Bestimmter Artikel', note: 'der, die, das' },
  { id: 'indef', title: 'Unbestimmter Artikel', note: 'ein has no plural. Use kein or a possessive instead.' },
  { id: 'kein', title: 'kein und Possessiva', note: 'mein, dein, sein, ihr, unser, euer, Ihr decline the same way' },
  { id: 'dies', title: 'dieser-Gruppe', note: 'dieser, jener, jeder, welcher, mancher, solcher' },
]

function DeterminerTables() {
  const [active, setActive] = useState('def')
  const set = DET_SETS.find((s) => s.id === active) ?? DET_SETS[0]!

  return (
    <section className="flex flex-col gap-4">
      <LedgerHead label="Artikel und Determinative" />
      <div className="flex flex-wrap gap-1.5">
        {DET_SETS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActive(option.id)}
            aria-pressed={active === option.id}
            className={cn(
              'h-9 border px-3 text-[16px] transition-colors',
              active === option.id
                ? 'border-rule-strong bg-foreground text-background'
                : 'border-rule hover:bg-secondary',
            )}
          >
            {option.title}
          </button>
        ))}
      </div>
      <p className="text-[16px] text-foreground-soft">{set.note}</p>
      <GridTable
        caption={set.title}
        rows={KASUS.map((kasus) => ({
          head: KASUS_LABEL[kasus],
          sub: KASUS_QUESTION[kasus],
          kasus,
          cells: SLOTS.map((slot) => {
            const det = determiner(set.id)
            if (det.only && det.only === 'sg' && slot === 'pl') return null
            return determinerForm(det, slot, kasus)
          }),
        }))}
      />
      <GenderKey className="pt-1" />
    </section>
  )
}

const ADJ_SETS = [
  { id: 'weak' as const, title: 'Schwach', note: 'after der, dieser, jeder, where the determiner already marks the case' },
  { id: 'mixed' as const, title: 'Gemischt', note: 'after ein, kein, mein, where the adjective fills in the slots ein leaves unmarked' },
  { id: 'strong' as const, title: 'Stark', note: 'no determiner, so the adjective carries the case marking itself' },
]

function AdjectiveTables() {
  const [active, setActive] = useState<'weak' | 'mixed' | 'strong'>('weak')
  const set = ADJ_SETS.find((s) => s.id === active) ?? ADJ_SETS[0]!

  return (
    <section className="flex flex-col gap-4">
      <LedgerHead label="Adjektivendungen" />
      <div className="flex flex-wrap gap-1.5">
        {ADJ_SETS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActive(option.id)}
            aria-pressed={active === option.id}
            className={cn(
              'h-9 border px-3 text-[16px] transition-colors',
              active === option.id
                ? 'border-rule-strong bg-foreground text-background'
                : 'border-rule hover:bg-secondary',
            )}
          >
            {option.title}
          </button>
        ))}
      </div>
      <p className="text-[16px] text-foreground-soft">{set.note}</p>
      <GridTable
        caption={`Adjektivendungen ${set.title}`}
        rows={KASUS.map((kasus) => ({
          head: KASUS_LABEL[kasus],
          kasus,
          cells: SLOTS.map((slot) => `-${adjEnding(set.id, slot, kasus)}`),
        }))}
      />
    </section>
  )
}

/* ------------------------------------------------------------ noun lookup */

function NounLookup() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('kind')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return NOUNS.filter((n) => n.word.toLowerCase().includes(q) || n.en.toLowerCase().includes(q)).slice(0, 8)
  }, [query])

  const target = NOUNS.find((n) => n.id === selected) ?? nounById('kind')
  const cell = (kasus: Kasus, num: Numerus) =>
    target.plural === '' && num === 'pl' ? null : nounPhrase(target, { det: 'def', kasus, num }).text

  return (
    <section className="flex flex-col gap-4">
      <LedgerHead label="Substantiv nachsehen" right={`${NOUNS.length} Wörter`} />

      <label className="flex items-center gap-3 border-b border-rule pb-2">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Herz, neighbour, Wohnung…"
          aria-label="Search nouns"
          autoComplete="off"
          name="substantivsuche"
          spellCheck={false}
          className="de w-full border-b border-transparent bg-transparent text-[19px] outline-none focus-visible:border-foreground placeholder:text-foreground-soft/50"
        />
      </label>

      {matches.length > 0 && (
        <ul className="flex flex-col border-b border-rule">
          {matches.map((n) => (
            <li key={n.id} className="border-b border-rule last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  setSelected(n.id)
                  setQuery('')
                }}
                className="flex min-h-[48px] w-full items-baseline gap-3 py-2.5 text-left hover:bg-secondary/60"
              >
                <span
                  aria-hidden
                  className="h-6 w-[5px] shrink-0"
                  style={{ background: GENDER_FILL[n.gender] }}
                />
                <span className="de flex-1 text-[17px] font-semibold" style={{ color: GENDER_VAR[n.gender] }}>
                  {({ m: 'der', f: 'die', n: 'das' } as Record<Gender, string>)[n.gender]} {n.word}
                </span>
                <span className="text-[16px] text-foreground-soft">{n.en}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Rail gender={target.gender} tint={16} className="p-4">
        <p className="de text-[clamp(1.8rem,7vw,2.6rem)] leading-none" style={{ color: GENDER_VAR[target.gender] }}>
          {({ m: 'der', f: 'die', n: 'das' } as Record<Gender, string>)[target.gender]} {target.word}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 pt-2 text-[16px] text-foreground-soft">
          <span>{target.en}</span>
          <GenderChip gender={target.gender} />
          <span className="de text-[17px]">
            Plural: {target.plural ? `die ${target.plural}` : 'keiner'}
          </span>
        </p>
      </Rail>

      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[340px] border-collapse text-left">
          <thead>
            <tr className="border-b-[1.5px] border-rule-strong">
              <th scope="col" className="w-[7.5rem] pb-2 pr-3 text-[15px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Kasus
              </th>
              <th scope="col" className="pb-2 pr-3 text-[15px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Singular
              </th>
              <th scope="col" className="pb-2 text-[15px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Plural
              </th>
            </tr>
          </thead>
          <tbody>
            {KASUS.map((kasus) => (
              <tr key={kasus} className="border-b border-rule">
                <th
                  scope="row"
                  className="px-2 py-2 align-middle"
                  style={{ background: KASUS_FILL[kasus], color: KASUS_ON[kasus] }}
                >
                  <span className="block text-[16px] font-semibold">{KASUS_LABEL[kasus]}</span>
                  <span className="block text-[15px] opacity-80">{KASUS_QUESTION[kasus]}</span>
                </th>
                <td className="de py-2.5 pr-3 align-baseline text-[18px]">{cell(kasus, 'sg')}</td>
                <td className="de py-2.5 align-baseline text-[18px]">{cell(kasus, 'pl') ?? '·'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(target.hint || target.oblique) && (
        <p className="text-[16px] leading-snug text-foreground-soft">
          {target.oblique && (
            <>
              n-Deklination: {nounForm(target, 'akk', 'sg').form} in every case but the nominative
              singular.{' '}
            </>
          )}
          {target.hint}
        </p>
      )}
    </section>
  )
}

/* ------------------------------------------------------------- verb list */

const LEVEL_OPTIONS: Array<Level | 'alle'> = ['alle', 'A1', 'A2', 'B1', 'B2', 'C1']

function VerbList() {
  const [query, setQuery] = useState('')
  // A reference is for looking things up, including words above your level, so
  // nothing is hidden unless you ask. The practice level cap stays in Settings
  // where it belongs, governing the drills.
  const [level, setLevel] = useState<Level | 'alle'>('alle')
  const [onlyIrregular, setOnlyIrregular] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return VERBS.filter((v) => {
      if (level !== 'alle' && !withinLevel(v.level, level)) return false
      if (onlyIrregular && v.class === 'weak') return false
      if (!q) return true
      return v.infinitive.toLowerCase().includes(q) || v.en.toLowerCase().includes(q)
    })
  }, [query, onlyIrregular, level])

  const filters = [
    level !== 'alle' ? `bis ${level}` : null,
    onlyIrregular ? 'nur unregelmäßige' : null,
    query.trim() ? `Suche „${query.trim()}“` : null,
  ].filter((f): f is string => Boolean(f))

  return (
    <section className="flex flex-col gap-4">
      <LedgerHead
        label="Verben"
        right={filters.length > 0 ? `${matches.length} von ${VERBS.length}` : `${VERBS.length} Verben`}
      />

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 border-b border-rule pb-2">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="nehmen, to take…"
            aria-label="Search verbs"
            autoComplete="off"
            name="verbsuche"
            spellCheck={false}
            className="de w-full border-b border-transparent bg-transparent text-[19px] outline-none focus-visible:border-foreground placeholder:text-foreground-soft/50"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          {LEVEL_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLevel(option)}
              aria-pressed={level === option}
              className={cn(
                'h-10 border px-3 text-[16px] transition-colors',
                level === option
                  ? 'border-rule-strong bg-foreground text-background'
                  : 'border-rule hover:bg-secondary',
              )}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOnlyIrregular((v) => !v)}
            aria-pressed={onlyIrregular}
            className={cn(
              'h-10 border px-3 text-[16px] transition-colors',
              onlyIrregular
                ? 'border-rule-strong bg-foreground text-background'
                : 'border-rule hover:bg-secondary',
            )}
          >
            Nur unregelmäßige
          </button>
        </div>

        {filters.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] text-foreground-soft">
            <span>Gefiltert: {filters.join(' · ')}.</span>
            <button
              type="button"
              onClick={() => {
                setLevel('alle')
                setOnlyIrregular(false)
                setQuery('')
              }}
              className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
            >
              Alle {VERBS.length} zeigen
            </button>
          </p>
        )}
      </div>

      <ul className="long-list flex flex-col">
        {matches.map((verb) => (
          <li key={verb.id} className="border-b border-rule">
            <Link
              to={`/paradigma/${verb.id}`}
              className="group flex min-h-[56px] items-start gap-3 py-3 transition-colors hover:bg-secondary/60"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="de text-[19px] font-semibold" lang="de">
                    {verb.infinitive}
                  </span>
                  <span className="text-[16px] text-foreground-soft">{verb.en}</span>
                </span>
                <PrincipalParts verb={verb} className="block" />
                <VerbFramesInline infinitive={verb.infinitive} />
              </span>
              <ChevronRight
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------ preposition list */

const GROUP_ORDER: PrepGroup[] = ['akk', 'dat', 'wechsel', 'gen']

function PrepositionList() {
  // Every preposition, not only the ones at your practice level.
  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: PREPOSITIONS.filter((p) => p.group === group),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col gap-10">
      {groups.map(({ group, items }) => (
        <section key={group} className="flex flex-col gap-1">
          <LedgerHead
            label={
              <span className="flex items-center gap-2">
                <KasusBar cases={GROUP_KASUS[group] ?? []} className="h-4" />
                <span style={{ color: KASUS_VAR[GROUP_KASUS[group]?.[0] ?? 'akk'] }}>
                  {PREP_GROUP_LABEL[group]}
                </span>
              </span>
            }
            right={`${items.length} Präposition${items.length === 1 ? '' : 'en'}`}
          />
          <ul className="long-list flex flex-col gap-2">
            {items.map((prep) => (
              <li
                key={prep.id}
                className="flex gap-3 border p-3"
                style={{
                  background: kasusTint(GROUP_KASUS[group]?.[0] ?? 'akk', 20),
                  borderColor: kasusTint(GROUP_KASUS[group]?.[0] ?? 'akk', 45),
                }}
              >
                <KasusBar cases={GROUP_KASUS[group] ?? []} className="self-stretch" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="de text-[22px] font-semibold leading-none">{prep.word}</span>
                  <span className="text-[16px] text-foreground-soft">{prep.en}</span>
                </div>

                {prep.wechsel && (
                  <dl className="grid gap-1 text-[16px] sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="shrink-0"><KasusName kasus="akk" /></dt>
                      <dd className="text-foreground-soft">{prep.wechsel.akk}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0"><KasusName kasus="dat" /></dt>
                      <dd className="text-foreground-soft">{prep.wechsel.dat}</dd>
                    </div>
                  </dl>
                )}

                <ul className="flex flex-col gap-1.5">
                  {prep.examples.map((example) => (
                    <li key={example.de} className="flex flex-col gap-0.5">
                      <span className="de text-[17px]">
                        {example.de}
                        <span
                          className="pl-2 font-sans text-[15px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: KASUS_VAR[example.kasus] }}
                        >
                          {KASUS_LABEL[example.kasus]}
                        </span>
                      </span>
                      <span className="text-[16px] italic text-foreground-soft">{example.en}</span>
                    </li>
                  ))}
                </ul>

                {prep.note && (
                  <p className="text-[16px] leading-relaxed text-foreground-soft">{prep.note}</p>
                )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-1">
        <LedgerHead label="Wo? oder wohin?" right="5 Paare" />
        <p className="py-3 text-[16px] leading-snug text-foreground-soft">
          The stative verb is strong and takes a dative. The one that moves something is weak and
          takes an accusative. Get these five right and the two-way prepositions stop being a
          guess.
        </p>
        <ul className="flex flex-col">
          {POSITION_PAIRS.map((pair) => (
            <li key={pair.id} className="grid gap-3 border-b border-rule py-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1 border-l-[5px] pl-3" style={{ borderColor: KASUS_FILL.dat, background: kasusTint('dat', 18) }}>
                <span className="eyebrow" style={{ color: KASUS_VAR.dat }}>Wo? · Dativ</span>
                <span className="de text-[18px]">
                  {pair.stative.verb} <span className="text-foreground-soft">({pair.stative.forms})</span>
                </span>
                <span className="de text-[17px]">{pair.example.dat.de}</span>
                <span className="text-[16px] italic text-foreground-soft">{pair.example.dat.en}</span>
              </div>
              <div className="flex flex-col gap-1 border-l-[5px] pl-3" style={{ borderColor: KASUS_FILL.akk, background: kasusTint('akk', 18) }}>
                <span className="eyebrow" style={{ color: KASUS_VAR.akk }}>Wohin? · Akkusativ</span>
                <span className="de text-[18px]">
                  {pair.dynamic.verb} <span className="text-foreground-soft">({pair.dynamic.forms})</span>
                </span>
                <span className="de text-[17px]">{pair.example.akk.de}</span>
                <span className="text-[16px] italic text-foreground-soft">{pair.example.akk.en}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* ---------------------------------------------------------- valency list */

function frameKasus(frame: Valency['frames'][number]): Kasus | null {
  if (frame.prepCase) return frame.prepCase
  if (frame.pattern.startsWith('dat')) return 'dat'
  if (frame.pattern.startsWith('akk')) return 'akk'
  if (frame.pattern === 'gen') return 'gen'
  return null
}

function ValencyRow({ entry }: { entry: Valency }) {
  return (
    <li className="flex flex-col gap-2 border-b border-rule py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="de text-[20px] font-semibold leading-none">{entry.verb}</span>
        <span className="text-[16px] text-foreground-soft">{entry.en}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {entry.frames.map((frame, i) => (
          <li
            key={i}
            className="flex flex-col gap-1.5 border-l-[5px] p-3"
            style={{
              borderColor: frameKasus(frame) ? KASUS_FILL[frameKasus(frame) as Kasus] : 'var(--rule)',
              background: frameKasus(frame) ? kasusTint(frameKasus(frame) as Kasus, 14) : undefined,
            }}
          >
            <span className="flex flex-wrap items-center gap-1.5">
              {pillsOf(frame).map((pill) => (
                <KasusPill key={pill.label} pill={pill} />
              ))}
              {frame.sense && <span className="text-[16px] text-foreground-soft">{frame.sense}</span>}
            </span>
            <span className="de text-[17px]" lang="de">{frame.example.de}</span>
            <span className="text-[16px] italic text-foreground-soft">{frame.example.en}</span>
          </li>
        ))}
      </ul>
      {entry.note && <p className="text-[16px] leading-snug text-foreground-soft">{entry.note}</p>}
    </li>
  )
}

function ValencyList() {
  const allowed = VALENCY

  const sections: Array<{ label: string; blurb?: string; kasus?: Kasus; items: Valency[] }> = [
    {
      label: 'Bedeutung ändert sich',
      blurb: 'Same verb, different frame, different meaning.',
      items: allowed.filter((v) => v.frames.length > 1),
    },
    {
      label: 'Nur Dativ',
      kasus: 'dat' as Kasus,
      items: allowed.filter((v) => v.frames.length === 1 && v.frames[0]?.pattern === 'dat'),
    },
    {
      label: 'Dativ + Akkusativ',
      kasus: 'dat' as Kasus,
      items: allowed.filter((v) => v.frames.length === 1 && v.frames[0]?.pattern === 'dat+akk'),
    },
    {
      label: 'Genitiv',
      kasus: 'gen' as Kasus,
      items: allowed.filter(
        (v) => v.frames.length === 1 && (v.frames[0]?.pattern === 'gen' || v.frames[0]?.pattern === 'akk+gen'),
      ),
    },
    {
      label: 'Feste Präposition',
      items: allowed.filter((v) => v.frames.length === 1 && v.frames[0]?.pattern === 'prep'),
    },
    {
      label: 'Nur Akkusativ',
      kasus: 'akk' as Kasus,
      items: allowed.filter(
        (v) => v.frames.length === 1 && (v.frames[0]?.pattern === 'akk' || v.frames[0]?.pattern === 'akk+akk'),
      ),
    },
  ].filter((section) => section.items.length > 0)

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <section key={section.label} className="flex flex-col gap-1">
          <LedgerHead
            label={
              section.kasus ? (
                <span className="flex items-center gap-2">
                  <KasusBar cases={[section.kasus]} className="h-4" />
                  <span style={{ color: KASUS_VAR[section.kasus] }}>{section.label}</span>
                </span>
              ) : (
                section.label
              )
            }
            right={`${section.items.length} Verben`}
          />
          {section.blurb && (
            <p className="py-3 text-[16px] leading-snug text-foreground-soft">{section.blurb}</p>
          )}
          <ul className="long-list flex flex-col">
            {section.items.map((entry) => (
              <ValencyRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
