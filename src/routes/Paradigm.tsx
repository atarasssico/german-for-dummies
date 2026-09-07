import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Search, Shuffle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LedgerHead } from '@/components/Ledger'
import { UmlautKeys } from '@/components/UmlautKeys'
import { VERBS, VERB_BY_ID } from '@/data/verbs'
import type { PersonKey, Tense, Verb } from '@/engine/conjugate'
import {
  PERSON_LABEL, TENSES, TENSE_HINT, TENSE_LABEL, conjugate, partizip2, personsFor, praetBase,
  prefersWuerde,
} from '@/engine/conjugate'
import { grade } from '@/engine/grade'
import type { GradeResult } from '@/engine/grade'
import { withinLevel } from '@/engine/questions'
import { useProgress } from '@/store/progress'
import { cn } from '@/lib/utils'

/**
 * Write the whole paradigm out, one row per person, and get corrected cell by
 * cell. Each cell is the same scheduled card as the single-form drill
 * (`conj:<verb>:<tense>:<person>`), so a writeout feeds the same box.
 */
export function Paradigm() {
  const { verbId } = useParams<{ verbId: string }>()
  const navigate = useNavigate()
  const { settings, recordAnswer, progress } = useProgress()

  const verb = verbId ? VERB_BY_ID.get(verbId) : undefined
  const [tense, setTense] = useState<Tense>('praesens')
  const [values, setValues] = useState<Partial<Record<PersonKey, string>>>({})
  const [results, setResults] = useState<Partial<Record<PersonKey, GradeResult>>>({})
  const cells = useRef<Partial<Record<PersonKey, HTMLInputElement | null>>>({})
  const [focused, setFocused] = useState<PersonKey | null>(null)

  const persons = useMemo(() => personsFor(tense).filter((p) => !verb?.only3rd || p === 'er'), [tense, verb])

  useEffect(() => {
    setValues({})
    setResults({})
    cells.current[persons[0] as PersonKey]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verbId, tense])

  if (!verb) return <VerbPicker onPick={(id) => navigate(`/paradigma/${id}`)} />

  const checked = Object.keys(results).length > 0
  const rightCount = persons.filter((p) => results[p]?.verdict === 'correct').length

  const check = () => {
    const next: Partial<Record<PersonKey, GradeResult>> = {}
    for (const person of persons) {
      const form = conjugate(verb, tense, person)
      const graded = grade(values[person] ?? '', form.text, form.alts, {
        tolerateCase: true, // person forms are not nouns; capitals are not the point here
        tolerateAsciiUmlauts: settings.tolerateAsciiUmlauts,
      })
      next[person] = graded
      recordAnswer(`conj:${verb.id}:${tense}:${person}`, graded.verdict === 'correct')
    }
    setResults(next)
  }

  /** Types an umlaut into whichever cell the cursor is in. */
  const insertChar = (char: string) => {
    const person = focused ?? (persons[0] as PersonKey)
    const el = cells.current[person]
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const current = values[person] ?? ''
    setValues((prev) => ({ ...prev, [person]: current.slice(0, start) + char + current.slice(end) }))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + 1, start + 1)
    })
  }

  const reset = () => {
    setValues({})
    setResults({})
    cells.current[persons[0] as PersonKey]?.focus()
  }

  const nextVerb = () => {
    const pool = VERBS.filter((v) => withinLevel(v.level, settings.level) && v.id !== verb.id)
    // Prefer a verb with unseen cells in this tense, so the picker is not random noise.
    const unseen = pool.filter((v) =>
      personsFor(tense).some((p) => !progress.cards[`conj:${v.id}:${tense}:${p}`]),
    )
    const from = unseen.length ? unseen : pool
    const pick = from[Math.floor(Math.random() * from.length)]
    if (pick) navigate(`/paradigma/${pick.id}`)
  }

  return (
    <div className="flex min-h-dvh flex-col gap-6 pb-10">
      <header className="flex items-start justify-between gap-4 pt-4">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Konjugation schreiben</span>
          <h1 className="de text-[clamp(2rem,9vw,3rem)] font-semibold leading-none" lang="de">{verb.infinitive}</h1>
          <p className="text-[16px] text-foreground-soft">
            {verb.en}
            {verb.class !== 'weak' && (
              <>
                <span className="px-2 text-rule-strong">/</span>
                <span className="de text-[17px]">
                  {praetBase(verb)} · {verb.aux === 'sein' ? 'ist' : 'hat'} {partizip2(verb)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={nextVerb}
            className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Another verb"
          >
            <Shuffle className="size-4" aria-hidden />
          </button>
          <Link
            to="/paradigma"
            className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Choose a verb"
          >
            <Search className="size-4" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="-mx-5 overflow-x-auto px-5">
        <div className="flex gap-1 pb-1" role="tablist" aria-label="Tense">
          {TENSES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={tense === option}
              onClick={() => setTense(option)}
              className={cn(
                'shrink-0 border-b-[1.5px] px-3 py-2 text-[16px] tracking-wide transition-colors',
                tense === option
                  ? 'border-rule-strong font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {TENSE_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      <p className="border-y border-rule py-2.5 text-[16px] text-foreground-soft">
        {TENSE_LABEL[tense]}: {TENSE_HINT[tense]}.
        {tense === 'konjunktiv2' && prefersWuerde(verb) && (
          <> Same as the Präteritum for this verb, so speakers use würde + Infinitiv.</>
        )}
      </p>

      <form
        className="flex flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          check()
        }}
      >
        {persons.map((person) => {
          const result = results[person]
          const right = result?.verdict === 'correct'
          return (
            <div key={person} className="flex items-baseline gap-3 border-b border-rule py-2.5">
              <label
                htmlFor={`cell-${person}`}
                className="w-[5.5rem] shrink-0 text-[16px] font-medium text-foreground-soft"
              >
                {tense === 'imperativ' ? (person === 'sie' ? 'Sie' : person) : PERSON_LABEL[person]}
              </label>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <input
                  id={`cell-${person}`}
                  ref={(el) => {
                    cells.current[person] = el
                  }}
                  onFocus={() => setFocused(person)}
                  value={values[person] ?? ''}
                  onChange={(event) => setValues((prev) => ({ ...prev, [person]: event.target.value }))}
                  readOnly={checked}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className={cn(
                    'de w-full border-b bg-transparent pb-1 text-[20px] leading-tight outline-none focus-visible:border-foreground focus-visible:bg-secondary/40',
                    checked
                      ? right
                        ? 'border-rule text-foreground'
                        : 'border-wrong text-wrong'
                      : 'border-rule',
                  )}
                />
                {checked && !right && (
                  <span className="de text-[17px] font-semibold">{result?.expected}</span>
                )}
              </div>
              {checked && (
                <span className="shrink-0 pt-1">
                  {right ? (
                    <Check className="size-4" aria-label="Correct" />
                  ) : (
                    <X className="size-4 text-wrong" aria-label="Wrong" />
                  )}
                </span>
              )}
            </div>
          )
        })}

        <div className="flex flex-col gap-4 pt-5">
          {!checked ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <UmlautKeys onInsert={insertChar} />
              <Button type="submit" size="lg" className="h-11 px-6">
                Prüfen
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="de text-[20px] tabular">
                {rightCount} <span className="text-muted-foreground">von {persons.length}</span>
              </span>
              <Button type="button" onClick={reset} size="lg" className="h-11 px-6">
                Noch einmal
              </Button>
              <Button type="button" onClick={nextVerb} variant="outline" size="lg" className="h-11 px-5">
                Nächstes Verb
              </Button>
            </div>
          )}
          <Button asChild variant="ghost" size="lg" className="h-11 w-full px-4 sm:w-fit sm:self-end">
            <Link to="/">Zur Übersicht</Link>
          </Button>
        </div>
      </form>

      {verb.note && (
        <p className="border-t border-rule pt-3 text-[16px] leading-snug text-foreground-soft">
          {verb.note}
        </p>
      )}
    </div>
  )
}

function VerbPicker({ onPick }: { onPick: (id: string) => void }) {
  const { settings } = useProgress()
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = VERBS.filter((v) => withinLevel(v.level, settings.level))
    const scored = q
      ? pool.filter((v) => v.infinitive.toLowerCase().includes(q) || v.en.toLowerCase().includes(q))
      : pool.filter((v) => v.class !== 'weak')
    return scored.slice(0, 40)
  }, [query, settings.level])

  return (
    <div className="flex flex-col gap-5 pt-4">
      <LedgerHead label="Verb wählen" right={`${VERBS.length} Verben`} />

      <label className="flex items-center gap-3 border-b border-rule pb-2">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="geben, to give, anrufen…"
          aria-label="Search verbs"
          autoComplete="off"
          name="verbsuche"
          spellCheck={false}
          className="de w-full border-b border-transparent bg-transparent text-[20px] outline-none focus-visible:border-foreground placeholder:text-muted-foreground/60"
        />
      </label>

      {matches.length === 0 ? (
        <p className="py-6 text-base text-foreground-soft">
          No verb matches “{query}”. Try the infinitive, or the English.
        </p>
      ) : (
        <ul className="flex flex-col">
          {matches.map((verb) => (
            <li key={verb.id} className="border-b border-rule">
              <button
                type="button"
                onClick={() => onPick(verb.id)}
                className="flex min-h-[56px] w-full items-baseline gap-3 py-3 text-left transition-colors hover:bg-secondary/60"
              >
                <span className="de min-w-0 flex-1 text-[19px]">{verb.infinitive}</span>
                <PrincipalParts verb={verb} />
                <span className="w-9 shrink-0 text-right text-[15px] uppercase tracking-[0.08em] text-muted-foreground">
                  {verb.level}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PrincipalParts({ verb, className }: { verb: Verb; className?: string }) {
  if (verb.class === 'weak') {
    return <span className={cn('text-[16px] text-foreground-soft', className)}>regelmäßig</span>
  }
  return (
    <span className={cn('de hidden text-[17px] text-foreground-soft sm:inline', className)}>
      {praetBase(verb)} · {verb.aux === 'sein' ? 'ist' : 'hat'} {partizip2(verb)}
    </span>
  )
}
