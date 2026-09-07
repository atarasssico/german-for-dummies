import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenderChip, GenderKey, Rail } from '@/components/Rail'
import { LedgerHead } from '@/components/Ledger'
import { PrincipalParts } from '@/routes/Paradigm'
import { NOUNS, noun as nounById } from '@/data/nouns'
import { PREPOSITIONS, PREP_GROUP_LABEL } from '@/data/prepositions'
import type { PrepGroup } from '@/data/prepositions'
import { POSITION_PAIRS, PATTERN_LABEL, VALENCY } from '@/data/valency'
import type { Valency } from '@/data/valency'
import { VERBS } from '@/data/verbs'
import type { Gender, Kasus, Numerus, Slot } from '@/engine/grammar'
import {
  KASUS, KASUS_LABEL, KASUS_QUESTION, adjEnding, determiner, determinerForm, nounForm, nounPhrase,
} from '@/engine/grammar'
import { withinLevel } from '@/engine/questions'
import { GENDER_VAR, genderTint } from '@/lib/gender'
import { useProgress } from '@/store/progress'
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
                className="shrink-0 rounded-none border-0 border-b-[1.5px] border-transparent px-3 py-2 text-[15px] tracking-wide text-foreground-soft shadow-none data-[state=active]:border-rule-strong data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none"
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
  rows: Array<{ head: string; sub?: string; cells: Array<string | null> }>
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-[1.5px] border-rule-strong">
            <th scope="col" className="w-[7.5rem] pb-2 pr-3 text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Kasus
            </th>
            {SLOTS.map((slot) => (
              <th
                key={slot}
                scope="col"
                className="px-2 pb-2 pt-1 text-[13px] font-semibold uppercase tracking-[0.1em]"
                style={{
                  color: SLOT_HEAD[slot].colour ?? 'var(--muted-foreground)',
                  background: SLOT_HEAD[slot].gender ? genderTint(SLOT_HEAD[slot].gender, 24) : undefined,
                }}
              >
                {SLOT_HEAD[slot].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.head} className="border-b border-rule">
              <th scope="row" className="py-2.5 pr-3 align-baseline">
                <span className="block text-[15px] font-medium">{row.head}</span>
                {row.sub && <span className="block text-[13px] text-muted-foreground">{row.sub}</span>}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className="de px-2 py-2.5 align-baseline text-[18px]"
                  style={{
                    color: SLOT_HEAD[SLOTS[i] as Slot].colour,
                    background: SLOT_HEAD[SLOTS[i] as Slot].gender
                      ? genderTint(SLOT_HEAD[SLOTS[i] as Slot].gender, 9)
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
              'h-9 border px-3 text-[14px] transition-colors',
              active === option.id
                ? 'border-rule-strong bg-foreground text-background'
                : 'border-rule hover:bg-secondary',
            )}
          >
            {option.title}
          </button>
        ))}
      </div>
      <p className="text-[14px] text-foreground-soft">{set.note}</p>
      <GridTable
        caption={set.title}
        rows={KASUS.map((kasus) => ({
          head: KASUS_LABEL[kasus],
          sub: KASUS_QUESTION[kasus],
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
              'h-9 border px-3 text-[14px] transition-colors',
              active === option.id
                ? 'border-rule-strong bg-foreground text-background'
                : 'border-rule hover:bg-secondary',
            )}
          >
            {option.title}
          </button>
        ))}
      </div>
      <p className="text-[14px] text-foreground-soft">{set.note}</p>
      <GridTable
        caption={`Adjektivendungen ${set.title}`}
        rows={KASUS.map((kasus) => ({
          head: KASUS_LABEL[kasus],
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
                  style={{ background: GENDER_VAR[n.gender] }}
                />
                <span className="de flex-1 text-[17px] font-semibold" style={{ color: GENDER_VAR[n.gender] }}>
                  {({ m: 'der', f: 'die', n: 'das' } as Record<Gender, string>)[n.gender]} {n.word}
                </span>
                <span className="text-[14px] text-foreground-soft">{n.en}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Rail gender={target.gender} tint={16} className="p-4">
        <p className="de text-[clamp(1.8rem,7vw,2.6rem)] leading-none" style={{ color: GENDER_VAR[target.gender] }}>
          {({ m: 'der', f: 'die', n: 'das' } as Record<Gender, string>)[target.gender]} {target.word}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 pt-2 text-[15px] text-foreground-soft">
          <span>{target.en}</span>
          <GenderChip gender={target.gender} />
          <span className="de text-[16px]">
            Plural: {target.plural ? `die ${target.plural}` : 'keiner'}
          </span>
        </p>
      </Rail>

      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[340px] border-collapse text-left">
          <thead>
            <tr className="border-b-[1.5px] border-rule-strong">
              <th scope="col" className="w-[7.5rem] pb-2 pr-3 text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Kasus
              </th>
              <th scope="col" className="pb-2 pr-3 text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Singular
              </th>
              <th scope="col" className="pb-2 text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Plural
              </th>
            </tr>
          </thead>
          <tbody>
            {KASUS.map((kasus) => (
              <tr key={kasus} className="border-b border-rule">
                <th scope="row" className="py-2.5 pr-3 align-baseline">
                  <span className="block text-[15px] font-semibold">{KASUS_LABEL[kasus]}</span>
                  <span className="block text-[13px] text-muted-foreground">{KASUS_QUESTION[kasus]}</span>
                </th>
                <td className="de py-2.5 pr-3 align-baseline text-[18px]">{cell(kasus, 'sg')}</td>
                <td className="de py-2.5 align-baseline text-[18px]">{cell(kasus, 'pl') ?? '·'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(target.hint || target.oblique) && (
        <p className="text-[14px] leading-snug text-foreground-soft">
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

function VerbList() {
  const { settings } = useProgress()
  const [query, setQuery] = useState('')
  const [onlyIrregular, setOnlyIrregular] = useState(true)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return VERBS.filter((v) => {
      if (!withinLevel(v.level, settings.level)) return false
      if (onlyIrregular && v.class === 'weak') return false
      if (!q) return true
      return v.infinitive.toLowerCase().includes(q) || v.en.toLowerCase().includes(q)
    })
  }, [query, onlyIrregular, settings.level])

  return (
    <section className="flex flex-col gap-4">
      <LedgerHead label="Verben" right={`${matches.length} von ${VERBS.length}`} />

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
        <button
          type="button"
          onClick={() => setOnlyIrregular((v) => !v)}
          aria-pressed={onlyIrregular}
          className={cn(
            'h-9 w-fit border px-3 text-[14px] transition-colors',
            onlyIrregular ? 'border-rule-strong bg-foreground text-background' : 'border-rule hover:bg-secondary',
          )}
        >
          Nur unregelmäßige
        </button>
      </div>

      <ul className="long-list flex flex-col">
        {matches.map((verb) => (
          <li key={verb.id} className="border-b border-rule">
            <Link
              to={`/paradigma/${verb.id}`}
              className="group flex min-h-[56px] items-baseline gap-3 py-3 transition-colors hover:bg-secondary/60"
            >
              <span className="de min-w-0 flex-[1.1] text-[19px]">{verb.infinitive}</span>
              <span className="hidden flex-1 text-[14px] text-foreground-soft sm:block">{verb.en}</span>
              <PrincipalParts verb={verb} />
              <ChevronRight
                className="size-4 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5"
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
  const { settings } = useProgress()
  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: PREPOSITIONS.filter((p) => p.group === group && withinLevel(p.level, settings.level)),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col gap-10">
      {groups.map(({ group, items }) => (
        <section key={group} className="flex flex-col gap-1">
          <LedgerHead
            label={PREP_GROUP_LABEL[group]}
            right={`${items.length} Präposition${items.length === 1 ? '' : 'en'}`}
          />
          <ul className="long-list flex flex-col">
            {items.map((prep) => (
              <li key={prep.id} className="flex flex-col gap-2 border-b border-rule py-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="de text-[22px] font-semibold leading-none">{prep.word}</span>
                  <span className="text-[15px] text-foreground-soft">{prep.en}</span>
                </div>

                {prep.wechsel && (
                  <dl className="grid gap-1 text-[14px] sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium">Akkusativ</dt>
                      <dd className="text-muted-foreground">{prep.wechsel.akk}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium">Dativ</dt>
                      <dd className="text-muted-foreground">{prep.wechsel.dat}</dd>
                    </div>
                  </dl>
                )}

                <ul className="flex flex-col gap-1.5">
                  {prep.examples.map((example) => (
                    <li key={example.de} className="flex flex-col gap-0.5">
                      <span className="de text-[17px]">
                        {example.de}
                        <span className="pl-2 font-sans text-[13px] uppercase tracking-[0.1em] text-muted-foreground">
                          {KASUS_LABEL[example.kasus]}
                        </span>
                      </span>
                      <span className="text-[14px] italic text-muted-foreground">{example.en}</span>
                    </li>
                  ))}
                </ul>

                {prep.note && (
                  <p className="text-[14px] leading-snug text-foreground-soft">{prep.note}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-1">
        <LedgerHead label="Wo? oder wohin?" right="5 Paare" />
        <p className="py-3 text-[14px] leading-snug text-foreground-soft">
          The stative verb is strong and takes a dative. The one that moves something is weak and
          takes an accusative. Get these five right and the two-way prepositions stop being a
          guess.
        </p>
        <ul className="flex flex-col">
          {POSITION_PAIRS.map((pair) => (
            <li key={pair.id} className="grid gap-3 border-b border-rule py-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="eyebrow">Wo? · Dativ</span>
                <span className="de text-[18px]">
                  {pair.stative.verb} <span className="text-muted-foreground">({pair.stative.forms})</span>
                </span>
                <span className="de text-[16px]">{pair.example.dat.de}</span>
                <span className="text-[14px] italic text-muted-foreground">{pair.example.dat.en}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="eyebrow">Wohin? · Akkusativ</span>
                <span className="de text-[18px]">
                  {pair.dynamic.verb} <span className="text-muted-foreground">({pair.dynamic.forms})</span>
                </span>
                <span className="de text-[16px]">{pair.example.akk.de}</span>
                <span className="text-[14px] italic text-muted-foreground">{pair.example.akk.en}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* ---------------------------------------------------------- valency list */

function frameText(frame: Valency['frames'][number]): string {
  if (frame.pattern === 'prep' && frame.prep && frame.prepCase) {
    return `${frame.prep} + ${KASUS_LABEL[frame.prepCase]}`
  }
  return PATTERN_LABEL[frame.pattern]
}

function ValencyRow({ entry }: { entry: Valency }) {
  return (
    <li className="flex flex-col gap-2 border-b border-rule py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="de text-[20px] font-semibold leading-none">{entry.verb}</span>
        <span className="text-[15px] text-foreground-soft">{entry.en}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {entry.frames.map((frame, i) => (
          <li key={i} className="flex flex-col gap-0.5 border-l-[3px] border-rule pl-3">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[14px] font-semibold">{frameText(frame)}</span>
              {frame.sense && <span className="text-[14px] text-foreground-soft">{frame.sense}</span>}
            </span>
            <span className="de text-[17px]">{frame.example.de}</span>
            <span className="text-[14px] italic text-muted-foreground">{frame.example.en}</span>
          </li>
        ))}
      </ul>
      {entry.note && <p className="text-[14px] leading-snug text-foreground-soft">{entry.note}</p>}
    </li>
  )
}

function ValencyList() {
  const { settings } = useProgress()
  const allowed = VALENCY.filter((v) => withinLevel(v.level, settings.level))

  const sections: Array<{ label: string; blurb?: string; items: Valency[] }> = [
    {
      label: 'Bedeutung ändert sich',
      blurb: 'Same verb, different frame, different meaning.',
      items: allowed.filter((v) => v.frames.length > 1),
    },
    {
      label: 'Nur Dativ',
      items: allowed.filter((v) => v.frames.length === 1 && v.frames[0]?.pattern === 'dat'),
    },
    {
      label: 'Dativ + Akkusativ',
      items: allowed.filter((v) => v.frames.length === 1 && v.frames[0]?.pattern === 'dat+akk'),
    },
    {
      label: 'Genitiv',
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
      items: allowed.filter(
        (v) => v.frames.length === 1 && (v.frames[0]?.pattern === 'akk' || v.frames[0]?.pattern === 'akk+akk'),
      ),
    },
  ].filter((section) => section.items.length > 0)

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <section key={section.label} className="flex flex-col gap-1">
          <LedgerHead label={section.label} right={`${section.items.length} Verben`} />
          {section.blurb && (
            <p className="py-3 text-[14px] leading-snug text-foreground-soft">{section.blurb}</p>
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
