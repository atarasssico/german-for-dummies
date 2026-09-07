import { cn } from '@/lib/utils'

const KEYS = ['ä', 'ö', 'ü', 'ß'] as const

/**
 * Typing umlauts is a keyboard problem, not a grammar one. The grader already
 * accepts ae/oe/ue/ss; these keys are for when you want the real spelling.
 */
export function UmlautKeys({
  onInsert,
  className,
}: {
  onInsert: (char: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1.5', className)}>
      {KEYS.map((char) => (
        <button
          key={char}
          type="button"
          // Keeps the text cursor where it was instead of stealing focus.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onInsert(char)}
          className="de flex h-11 min-w-11 items-center justify-center border border-rule bg-card text-[17px] leading-none transition-colors hover:bg-secondary active:bg-accent"
          aria-label={`Insert ${char}`}
        >
          {char}
        </button>
      ))}
    </div>
  )
}
