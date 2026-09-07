import type { ReactNode } from 'react'
import type { Gender } from '@/engine/grammar'
import { GENDER_ARTICLE, GENDER_NAME, GENDER_VAR, genderTint } from '@/lib/gender'
import { cn } from '@/lib/utils'

/**
 * The signature element: a 3px rail, coloured by grammatical gender, down the
 * left of anything nominal. Repeated on prompts, list rows and table headers so
 * gender becomes readable before the word is.
 */
export function Rail({
  gender,
  children,
  className,
  tint = 0,
}: {
  gender?: Gender
  children: ReactNode
  className?: string
  /** Percentage of the gender hue washed over the page ground behind the block. */
  tint?: number
}) {
  return (
    <div
      className={cn('relative pl-4', className)}
      style={{
        ['--rail-color' as string]: gender ? GENDER_VAR[gender] : 'var(--rule-strong)',
        ...(tint > 0 ? { background: genderTint(gender, tint) } : {}),
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[5px]"
        style={{ background: 'var(--rail-color)' }}
      />
      {children}
    </div>
  )
}

/** Gender stated in words as well as colour, so colour is never the only signal. */
export function GenderChip({ gender, className }: { gender: Gender; className?: string }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5 text-[13px] uppercase tracking-[0.1em]', className)}>
      <span aria-hidden className="mt-[1px] h-[11px] w-[3px] self-center" style={{ background: GENDER_VAR[gender] }} />
      <span style={{ color: GENDER_VAR[gender] }} className="font-medium">
        {GENDER_ARTICLE[gender]}
      </span>
      <span className="text-muted-foreground">{GENDER_NAME[gender]}</span>
    </span>
  )
}

export function GenderKey({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
      <GenderChip gender="m" />
      <GenderChip gender="f" />
      <GenderChip gender="n" />
    </div>
  )
}
