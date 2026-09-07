import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowRight, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Correction } from '@/components/Correction'
import { Rail } from '@/components/Rail'
import { UmlautKeys } from '@/components/UmlautKeys'
import type { GradeResult } from '@/engine/grade'
import { grade } from '@/engine/grade'
import type { Kasus } from '@/engine/grammar'
import { KASUS_LABEL } from '@/engine/grammar'
import type { Mode, Question } from '@/engine/questions'
import { MODES, MODE_LABEL, buildQuestion, poolFor } from '@/engine/questions'
import { pickSession } from '@/engine/srs'
import { useProgress } from '@/store/progress'
import { GENDER_VAR } from '@/lib/gender'
import { cn } from '@/lib/utils'

type Phase = 'answering' | 'answered'

interface LogEntry {
  id: string
  prompt: string
  expected: string
  given: string
  correct: boolean
}

const CASE_OPTIONS: Kasus[] = ['akk', 'dat', 'gen']

export function Session() {
  const { mode } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { settings, recordAnswer, setLastMode, progress } = useProgress()

  const valid = MODES.includes(mode as Mode)
  const activeMode = mode as Mode

  const [queue, setQueue] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('answering')
  const [typed, setTyped] = useState('')
  const [prep, setPrep] = useState('')
  const [prepCase, setPrepCase] = useState<Kasus | null>(null)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const startQueue = useCallback(
    (ids: string[]) => {
      setQueue(ids)
      setIndex(0)
      setPhase('answering')
      setTyped('')
      setPrep('')
      setPrepCase(null)
      setResult(null)
      setLog([])
    },
    [],
  )

  // Build the session once per mode. Re-picking on every render would reshuffle
  // the queue underneath the person answering it.
  useEffect(() => {
    if (!valid) return
    setLastMode(activeMode)
    startQueue(
      pickSession({
        pool: poolFor(activeMode, settings),
        states: progress.cards,
        count: settings.sessionLength,
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, valid])

  const cardId = queue[index]
  const question = useMemo<Question | null>(
    () => (cardId ? buildQuestion(cardId, settings) : null),
    // Rebuilding on a settings change mid-session would swap the card out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cardId],
  )

  // Autofocus only with a precise pointer: on a phone it would cover half the
  // screen with a keyboard before the question has even been read.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (phase === 'answering') inputRef.current?.focus()
    else nextRef.current?.focus()
  }, [phase, index])

  const submit = useCallback(
    (givenRaw: string, expectedOverride?: string) => {
      if (!question || phase === 'answered') return
      const given = givenRaw
      const expected = expectedOverride ?? question.answer.text
      const graded =
        question.kind === 'prep+case'
          ? gradePrepCase(question, prep, prepCase)
          : grade(given, expected, question.answer.alts, {
              tolerateCase: settings.tolerateCase,
              tolerateAsciiUmlauts: settings.tolerateAsciiUmlauts,
            })

      setResult(graded)
      setPhase('answered')
      recordAnswer(question.id, graded.verdict === 'correct')
      setLog((prev) => [
        ...prev,
        {
          id: question.id,
          prompt: [question.focusArticle, question.focus].filter(Boolean).join(' '),
          expected: question.answer.text,
          given: question.kind === 'prep+case' ? formatPrepCase(prep, prepCase) : given,
          correct: graded.verdict === 'correct',
        },
      ])
    },
    [question, phase, prep, prepCase, settings, recordAnswer],
  )

  const advance = useCallback(() => {
    setPhase('answering')
    setTyped('')
    setPrep('')
    setPrepCase(null)
    setResult(null)
    setIndex((i) => i + 1)
  }, [])

  if (!valid) {
    return (
      <div className="flex flex-col gap-4 pt-10">
        <p className="de text-3xl">Diesen Trainer gibt es nicht.</p>
        <Button asChild className="w-fit">
          <Link to="/">Back to practice</Link>
        </Button>
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col gap-4 pt-10">
        <p className="eyebrow">{MODE_LABEL[activeMode]}</p>
        <p className="de text-3xl">Nichts zu üben.</p>
        <p className="max-w-prose text-base text-muted-foreground">
          Every card in this trainer is scheduled for a later day. Raise the level in Settings to
          add more, or come back tomorrow.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/einstellungen">Settings</Link>
          </Button>
          <Button asChild>
            <Link to="/">Back to practice</Link>
          </Button>
        </div>
      </div>
    )
  }

  const finished = index >= queue.length
  if (finished) {
    return <SessionSummary mode={activeMode} log={log} onRetry={(ids) => startQueue(ids)} />
  }

  if (!question) {
    // The card id no longer resolves (data changed under a stored session).
    return (
      <div className="pt-10">
        <Button onClick={advance}>Skip this card</Button>
      </div>
    )
  }

  const answered = phase === 'answered'

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center gap-1 pt-3" aria-hidden>
        {queue.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-[3px] flex-1',
              i > index || (i === index && !answered)
                ? 'bg-rule'
                : log[i]?.correct === false
                  ? 'bg-wrong'
                  : 'bg-rule-strong',
            )}
          />
        ))}
      </div>

      <header className="flex items-baseline justify-between gap-4 border-b-[1.5px] border-rule-strong pb-2 pt-4">
        <span className="eyebrow">{MODE_LABEL[activeMode]}</span>
        <span className="flex items-center gap-3">
          <span className="eyebrow tabular">
            {String(index + 1).padStart(2, '0')} / {String(queue.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="-mr-1 flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="End session"
          >
            <X className="size-4" aria-hidden />
          </button>
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-7 pb-8 pt-7">
        {/* The material you are given. Secondary, because it is not the question. */}
        <div className="flex flex-col gap-2">
          {question.sourceLabel && <span className="eyebrow">{question.sourceLabel}</span>}
          <Rail gender={question.gender}>
            <p className="de text-[clamp(1.6rem,7vw,2.25rem)] leading-none" lang="de">
              {question.focusArticle && (
                <span style={{ color: question.gender ? GENDER_VAR[question.gender] : undefined }}>
                  {question.focusArticle}{' '}
                </span>
              )}
              {question.focus}
            </p>
            {question.sub && (
              <p className="pt-1.5 text-[14px] leading-snug text-muted-foreground">{question.sub}</p>
            )}
          </Rail>
        </div>

        {/* The task. Largest thing on the card, and it sits next to the input. */}
        <div className="flex flex-col gap-2 border-t border-rule pt-5">
          {question.target && (
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <ArrowDown className="size-4 shrink-0" aria-hidden />
              {question.lead}
            </span>
          )}
          <h1 className="de text-[clamp(1.8rem,8vw,2.75rem)] leading-[1]" lang="de">
            {question.target ?? question.lead}
          </h1>
          {question.targetHint && (
            <p className="text-[15px] leading-snug text-muted-foreground">{question.targetHint}</p>
          )}
          {question.spec && question.spec.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {question.spec.map((item) => (
                <li
                  key={item}
                  className="border border-rule px-2.5 py-1 text-[13px] text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        {question.cloze && (
          <p className="de border-y border-rule py-4 text-[clamp(1.1rem,4.6vw,1.5rem)] leading-snug" lang="de">
            {question.cloze.split('___').map((chunk, i, all) => (
              <span key={i}>
                {chunk}
                {i < all.length - 1 && (
                  <span className="mx-1 inline-block min-w-[2.5em] border-b-2 border-wrong align-baseline" />
                )}
              </span>
            ))}
          </p>
        )}

        {!answered && question.kind === 'type' && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              submit(typed)
            }}
          >
            <label htmlFor="antwort" className="eyebrow">
              {question.expects ?? 'Deine Antwort'}
            </label>
            <input
              id="antwort"
              ref={inputRef}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              name="antwort"
              lang="de"
              placeholder="hier tippen…"
              className="de w-full border-b-2 border-rule bg-transparent pb-2 text-[clamp(1.5rem,6vw,2.1rem)] leading-tight outline-none focus-visible:border-foreground focus-visible:bg-secondary/40 placeholder:text-muted-foreground/40"
            />
            <div className="flex items-center justify-between gap-3">
              <UmlautKeys
                onInsert={(char) => {
                  const el = inputRef.current
                  if (!el) return
                  const start = el.selectionStart ?? typed.length
                  const end = el.selectionEnd ?? typed.length
                  const next = typed.slice(0, start) + char + typed.slice(end)
                  setTyped(next)
                  requestAnimationFrame(() => {
                    el.focus()
                    el.setSelectionRange(start + 1, start + 1)
                  })
                }}
              />
              <Button type="submit" size="lg" className="h-11 px-6">
                Prüfen
              </Button>
            </div>
          </form>
        )}

        {!answered && question.kind === 'choice' && (
          <ul className="flex flex-col border-t border-rule">
            {question.choices?.map((choice) => (
              <li key={choice.id} className="border-b border-rule">
                <button
                  type="button"
                  onClick={() => submit(choice.id)}
                  className="flex min-h-[60px] w-full items-center gap-4 py-3 text-left transition-colors hover:bg-secondary/60"
                >
                  <span
                    aria-hidden
                    className="h-8 w-[3px] shrink-0"
                    style={{ background: choiceColour(choice.id) }}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className="de text-[23px] leading-none"
                      style={{ color: choiceColour(choice.id) }}
                    >
                      {choice.label}
                    </span>
                    {choice.sub && (
                      <span className="text-[14px] leading-snug text-muted-foreground">
                        {choice.sub}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!answered && question.kind === 'prep+case' && (
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault()
              if (prep.trim() && prepCase) submit(prep)
            }}
          >
            <label className="flex flex-col gap-2">
              <span className="eyebrow">Präposition</span>
              <input
                ref={inputRef}
                value={prep}
                onChange={(event) => setPrep(event.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                name="praeposition"
                lang="de"
                placeholder="auf, an, über…"
                className="de w-full border-b-2 border-rule bg-transparent pb-2 text-[clamp(1.4rem,5.5vw,1.9rem)] leading-tight outline-none focus-visible:border-foreground focus-visible:bg-secondary/40 placeholder:text-muted-foreground/40"
              />
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="eyebrow pb-2">Kasus</legend>
              <div className="flex flex-wrap gap-2">
                {CASE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPrepCase(option)}
                    aria-pressed={prepCase === option}
                    className={cn(
                      'h-11 border px-4 text-[15px] tracking-wide transition-colors',
                      prepCase === option
                        ? 'border-rule-strong bg-foreground text-background'
                        : 'border-rule hover:bg-secondary',
                    )}
                  >
                    {KASUS_LABEL[option]}
                  </button>
                ))}
              </div>
            </fieldset>

            <Button type="submit" size="lg" className="h-11 w-fit px-6" disabled={!prep.trim() || !prepCase}>
              Prüfen
            </Button>
          </form>
        )}

        {answered && result && (
          <Correction
            question={question}
            result={result}
            given={question.kind === 'prep+case' ? formatPrepCase(prep, prepCase) : typed}
          />
        )}
      </div>

      {answered && (
        <div
          className="sticky bottom-0 -mx-5 mt-6 border-t border-rule bg-background/95 px-5 py-3 backdrop-blur"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            ref={nextRef}
            onClick={advance}
            size="lg"
            className="h-12 w-full justify-between px-5 text-[16px]"
          >
            <span>{index + 1 === queue.length ? 'Fertig' : 'Weiter'}</span>
            <span className="flex items-center gap-2">
              <span className="hidden text-[13px] uppercase tracking-[0.1em] opacity-60 sm:inline">
                ⏎
              </span>
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}

function choiceColour(id: string): string | undefined {
  if (id === 'm') return GENDER_VAR.m
  if (id === 'f') return GENDER_VAR.f
  if (id === 'n') return GENDER_VAR.n
  return undefined
}

function formatPrepCase(prep: string, kasus: Kasus | null): string {
  return [prep.trim(), kasus ? `+ ${KASUS_LABEL[kasus]}` : null].filter(Boolean).join(' ')
}

/** Both halves have to be right: the preposition and the case it governs. */
function gradePrepCase(question: Question, prep: string, kasus: Kasus | null): GradeResult {
  const want = question.prepAnswer
  const prepResult = grade(prep, want?.prep ?? '', [], { tolerateCase: true })
  const caseRight = kasus === want?.kasus
  const bothRight = prepResult.verdict === 'correct' && caseRight

  return {
    verdict: bothRight ? 'correct' : 'wrong',
    expected: question.answer.text,
    leniency: prepResult.leniency,
    diff: prepResult.diff,
    nearMiss: prepResult.verdict === 'correct' && !caseRight,
    hint: bothRight
      ? undefined
      : prepResult.verdict === 'correct'
        ? `The preposition is right; ${want?.prep} governs the ${want ? KASUS_LABEL[want.kasus] : ''} here.`
        : caseRight
          ? 'The case is right, the preposition is not.'
          : undefined,
  }
}

function SessionSummary({
  mode,
  log,
  onRetry,
}: {
  mode: Mode
  log: LogEntry[]
  onRetry: (ids: string[]) => void
}) {
  const wrong = log.filter((entry) => !entry.correct)
  const right = log.length - wrong.length

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex flex-col gap-3">
        <span className="eyebrow">{MODE_LABEL[mode]} · fertig</span>
        <p className="de text-[clamp(2.5rem,11vw,4rem)] leading-[0.95]">
          {right} <span className="text-muted-foreground">von {log.length}</span>
        </p>
        <p className="text-base text-muted-foreground">
          {wrong.length === 0
            ? 'Every card right. They all move up a compartment.'
            : `${wrong.length} card${wrong.length === 1 ? '' : 's'} went back to the first compartment, so ${wrong.length === 1 ? 'it comes' : 'they come'} round again today.`}
        </p>
      </div>

      {wrong.length > 0 && (
        <section className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between border-b-[1.5px] border-rule-strong pb-2">
            <span className="eyebrow">Noch einmal</span>
          </div>
          <ul className="flex flex-col">
            {wrong.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rule py-3"
              >
                <span className="de min-w-0 flex-1 text-[18px]">{entry.prompt}</span>
                <span className="de text-[16px] text-wrong line-through">{entry.given || '·'}</span>
                <span className="de text-[16px]">{entry.expected}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {wrong.length > 0 && (
          <Button
            onClick={() => onRetry(wrong.map((entry) => entry.id))}
            size="lg"
            className="h-12 justify-between px-5"
          >
            <span>Die {wrong.length} falschen üben</span>
            <RotateCcw className="size-4" aria-hidden />
          </Button>
        )}
        <Button asChild variant={wrong.length > 0 ? 'outline' : 'default'} size="lg" className="h-12 px-5">
          <Link to={`/ueben/${mode}`}>Neue Runde</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="h-12 px-5">
          <Link to="/">Zur Übersicht</Link>
        </Button>
      </div>
    </div>
  )
}
