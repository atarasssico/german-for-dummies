import type { Kasus } from '@/engine/grammar'
import { KASUS_LABEL } from '@/engine/grammar'
import { KASUS_VAR } from '@/lib/kasus'
import { cn } from '@/lib/utils'

/** The case name, always in its own colour. */
export function KasusName({
  kasus,
  className,
  children,
}: {
  kasus: Kasus
  className?: string
  children?: React.ReactNode
}) {
  return (
    <span className={cn('font-semibold', className)} style={{ color: KASUS_VAR[kasus] }}>
      {children ?? KASUS_LABEL[kasus]}
    </span>
  )
}

/** A 4px bar in the case colour. Two cases stack, for the two-way prepositions. */
export function KasusBar({ cases, className }: { cases: Kasus[]; className?: string }) {
  return (
    <span aria-hidden className={cn('flex w-[5px] shrink-0 flex-col', className)}>
      {cases.map((kasus) => (
        <span key={kasus} className="flex-1" style={{ background: KASUS_VAR[kasus] }} />
      ))}
    </span>
  )
}
