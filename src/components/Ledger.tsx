import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A ruled row. The app is built from these rather than from cards. */
export function Row({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  return (
    <Tag className={cn('border-b border-rule py-3.5 last:border-b-0', className)}>{children}</Tag>
  )
}

/**
 * A section head: tracked-out label above a heavy rule. Renders a real heading
 * so the page has a navigable outline, since the label is what names the section.
 */
export function LedgerHead({
  label,
  right,
  className,
  as: Heading = 'h2',
}: {
  label: ReactNode
  right?: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 border-b-[1.5px] border-rule-strong pb-2',
        className,
      )}
    >
      <Heading className="eyebrow">{label}</Heading>
      {right ? <span className="eyebrow tabular">{right}</span> : null}
    </div>
  )
}
