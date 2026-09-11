import { Link } from 'react-router-dom'
import { ArrowRight, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenderKey } from '@/components/Rail'
import { GENDER_FILL } from '@/lib/gender'
import { LedgerHead } from '@/components/Ledger'
import { ProgressStrip } from '@/components/ProgressStrip'
import { MODES, MODE_BLURB, MODE_LABEL, poolFor } from '@/engine/questions'
import type { Mode } from '@/engine/questions'
import { boxHistogram } from '@/engine/srs'
import { todayKey, useProgress } from '@/store/progress'

const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

export function Home() {
  const { progress, settings, streak, summaryFor, ready } = useProgress()
  const today = progress.days[todayKey()] ?? { answered: 0, correct: 0 }
  const started = progress.totals.answered > 0

  const decks = MODES.map((mode) => ({ mode, summary: summaryFor(mode) }))
  const allPool = MODES.flatMap((mode) => poolFor(mode, settings))
  const histogram = boxHistogram(allPool, progress.cards)
  const unseen = allPool.length - histogram.reduce((a, b) => a + b, 0)
  const nextMode: Mode = progress.lastMode ?? 'articles'

  if (!ready) {
    return <div className="pt-10 text-base text-foreground-soft">Loading your box…</div>
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5">
        <LedgerHead
          label={DATE_FORMAT.format(new Date())}
          right={streak > 0 ? `Serie ${streak} Tag${streak === 1 ? '' : 'e'}` : 'Serie 0'}
        />

        {started ? (
          <div className="flex flex-col gap-1.5">
            <h1 className="de text-balance text-[clamp(2.5rem,11vw,4.25rem)] font-semibold leading-[0.95]">
              {today.answered}{' '}
              <span className="text-muted-foreground">
                Karte{today.answered === 1 ? '' : 'n'} heute
              </span>
            </h1>
            <p className="text-base tabular text-muted-foreground">
              {today.correct} richtig · {percent(today.correct, today.answered)} %
              <span className="px-2 text-rule-strong">/</span>
              {progress.totals.answered.toLocaleString('de-DE')} insgesamt ·{' '}
              {percent(progress.totals.correct, progress.totals.answered)} %
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h1 className="de text-balance text-[clamp(2rem,8vw,3.25rem)] font-semibold leading-[1.02]" lang="de">
              Fang mit <span className="text-gender-m">der</span>,{' '}
              <span className="text-gender-f">die</span>, <span className="text-gender-n">das</span> an.
            </h1>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              Every noun, verb form and preposition in here is a card. Get it right and it comes
              back in a few days. Get it wrong and it comes back today. Your progress stays in this
              browser.
            </p>
            <GenderKey />
          </div>
        )}

        <Button
          asChild
          size="lg"
          className="h-12 w-full justify-between px-5 text-[17px] sm:w-auto sm:min-w-[280px]"
        >
          <Link to={`/ueben/${nextMode}`}>
            <span>{started ? `Weiter mit ${MODE_LABEL[nextMode]}` : `Anfangen mit ${MODE_LABEL[nextMode]}`}</span>
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </section>

      {started && (
        <section className="flex flex-col gap-4">
          <LedgerHead label="Leitner-Kasten" right={`${unseen.toLocaleString('de-DE')} noch nicht begonnen`} />
          <ProgressStrip histogram={histogram} unseen={unseen} />
        </section>
      )}

      <section className="flex flex-col gap-1">
        <LedgerHead label="Trainer" right="fällig" />
        <ul className="flex flex-col">
          {decks.map(({ mode, summary }) => (
            <li key={mode} className="border-b border-rule last:border-b-0">
              <Link
                to={`/ueben/${mode}`}
                className="group flex min-h-[76px] items-center gap-4 py-4 transition-colors hover:bg-secondary/60"
              >
                {mode === 'articles' ? (
                  <span aria-hidden className="flex h-11 w-[5px] shrink-0 flex-col">
                    <span className="flex-1" style={{ background: GENDER_FILL.m }} />
                    <span className="flex-1" style={{ background: GENDER_FILL.f }} />
                    <span className="flex-1" style={{ background: GENDER_FILL.n }} />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="h-11 w-[5px] shrink-0 bg-rule-strong"
                    style={{ opacity: summary.seen === 0 ? 0.2 : 0.35 + 0.65 * summary.strengthOfSeen }}
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="de text-[22px] font-semibold leading-none" lang="de">{MODE_LABEL[mode]}</span>
                  <span className="text-[16px] leading-relaxed text-foreground-soft">
                    {MODE_BLURB[mode]}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className="text-[20px] leading-none tabular">
                    {summary.due.toLocaleString('de-DE')}
                  </span>
                  {/*
                    Not a percentage of the deck: one answer is worth 0.01% of
                    1,420 cards, so a whole session rounded to 0% and looked
                    broken. Both of these move on the first answer.
                  */}
                  <span className="text-[15px] uppercase tracking-[0.1em] text-muted-foreground tabular">
                    {summary.seen.toLocaleString('de-DE')} begonnen
                    {summary.known > 0 && ` · ${summary.known.toLocaleString('de-DE')} sicher`}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}

          {/* The paradigm writer belongs in this list: it drills the same cards
              as Verben, six at a time, so it is a fifth way in rather than a
              feature hidden behind one button. */}
          <li className="border-b border-rule last:border-b-0">
            <Link
              to="/paradigma"
              className="group flex min-h-[76px] items-center gap-4 py-4 transition-colors hover:bg-secondary/60"
            >
              <span aria-hidden className="h-11 w-[3px] shrink-0 bg-rule-strong opacity-40" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="de text-[22px] font-semibold leading-none" lang="de">
                  Konjugation schreiben
                </span>
                <span className="text-[16px] leading-snug text-foreground-soft">
                  Write out a whole paradigm, six forms at once, corrected cell by cell.
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                <Table2 className="size-5 text-muted-foreground" aria-hidden />
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
