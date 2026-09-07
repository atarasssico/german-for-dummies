import { BOX_INTERVALS } from '@/engine/srs'
import { cn } from '@/lib/utils'

function intervalLabel(days: number): string {
  return days === 0 ? 'heute' : `${days} T`
}

/**
 * The Leitner box, borrowed from the direction we did not pick: seven
 * compartments, each holding the cards on that review interval. Every
 * compartment keeps its full height whether it holds cards or not, so the row
 * reads as a physical box and an empty compartment is visible as empty.
 */
export function ProgressStrip({
  histogram,
  unseen,
  className,
}: {
  histogram: number[]
  unseen: number
  className?: string
}) {
  const max = Math.max(1, ...histogram)
  const total = histogram.reduce((sum, count) => sum + count, 0)
  const last = histogram.length - 1

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <ol
        className="flex items-stretch gap-1"
        aria-label={`${total} Karten im Kasten, ${unseen} noch nicht begonnen`}
      >
        {histogram.map((count, box) => (
          <li key={box} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div
              className="relative h-14 border border-rule bg-secondary"
              title={`Fach ${box + 1}: ${count} Karte${count === 1 ? '' : 'n'}, alle ${BOX_INTERVALS[box]} Tage`}
            >
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 bg-foreground"
                style={{
                  height: `${Math.round((count / max) * 100)}%`,
                  opacity: 0.35 + 0.65 * (box / last),
                }}
              />
            </div>
            <span className="text-center text-[15px] leading-none tabular">{count || '·'}</span>
            <span className="text-center text-[14px] uppercase leading-none tracking-[0.06em] text-muted-foreground">
              {intervalLabel(BOX_INTERVALS[box] ?? 0)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-[15px] leading-snug text-muted-foreground">
        A card moves one compartment right each time you get it right, and back to the first the
        moment you get it wrong.
      </p>
    </div>
  )
}
