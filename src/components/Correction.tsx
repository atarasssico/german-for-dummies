import { Check, X } from 'lucide-react'
import type { DiffPart, GradeResult } from '@/engine/grade'
import type { Question } from '@/engine/questions'
import { GenderChip } from '@/components/Rail'
import { cn } from '@/lib/utils'

/**
 * The typed answer aligned against the expected one: what you wrote struck
 * through, what was missing underlined. Both marks are shapes, not colours, so
 * the diff still reads without them.
 */
function Diff({ parts }: { parts: DiffPart[] }) {
  return (
    <span className="de text-[clamp(1.35rem,5.5vw,1.9rem)] leading-tight">
      {parts.map((part, index) => {
        if (part.op === 'same') return <span key={index}>{part.text}</span>
        if (part.op === 'extra') {
          return (
            <s key={index} className="text-wrong decoration-[1.5px]">
              {part.text}
            </s>
          )
        }
        return (
          <ins key={index} className="border-b-2 border-wrong text-wrong no-underline">
            {part.text}
          </ins>
        )
      })}
    </span>
  )
}

export function Correction({
  question,
  result,
  given,
}: {
  question: Question
  result: GradeResult
  given: string
}) {
  const right = result.verdict === 'correct'
  const showDiff = !right && question.kind === 'type' && given.trim().length > 0

  return (
    <section
      aria-live="polite"
      className={cn(
        'flex flex-col gap-4 border-l-[3px] pl-4',
        right ? 'border-rule-strong' : 'border-wrong',
      )}
    >
      <header className="flex items-baseline gap-2.5">
        {right ? (
          <Check className="mt-0.5 size-[18px] shrink-0" aria-hidden />
        ) : (
          <X className="mt-0.5 size-[18px] shrink-0 text-wrong" aria-hidden />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="eyebrow">{right ? 'Richtig' : 'Falsch'}</span>
          {showDiff ? (
            <Diff parts={result.diff} />
          ) : (
            <span className="de text-[clamp(1.35rem,5.5vw,1.9rem)] leading-tight">
              {question.kind === 'choice' ? answerLabel(question) : result.expected}
            </span>
          )}
        </div>
      </header>

      {showDiff && (
        <p className="text-base">
          <span className="eyebrow pr-2">richtig</span>
          <span className="de text-[18px]">{result.expected}</span>
        </p>
      )}

      {result.hint && <p className="text-[15px] leading-snug text-muted-foreground">{result.hint}</p>}

      <ul className="flex flex-col gap-1.5">
        {question.rules.map((rule) => (
          <li key={rule} className="flex gap-2.5 text-[15px] leading-snug">
            <span aria-hidden className="select-none pt-[3px] text-[12px] text-muted-foreground">
              §
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>

      {question.revealGender && <GenderChip gender={question.revealGender} />}

      {question.example && (
        <p className="flex flex-col gap-0.5 border-t border-rule pt-3 text-[15px]">
          <span className="de text-[17px]">{question.example.de}</span>
          <span className="text-muted-foreground italic">{question.example.en}</span>
        </p>
      )}

      {question.note && (
        <p className="border-t border-rule pt-3 text-[14px] leading-snug text-muted-foreground">
          {question.note}
        </p>
      )}
    </section>
  )
}

function answerLabel(question: Question): string {
  return question.choices?.find((c) => c.id === question.answer.text)?.label ?? question.answer.text
}
