import type { Frame } from '@/data/valency'
import { PATTERN_LABEL, valencyFor } from '@/data/valency'
import type { Kasus } from '@/engine/grammar'
import { KASUS_LABEL } from '@/engine/grammar'
import { KASUS_FILL, KASUS_ON, kasusTint } from '@/lib/kasus'
import { cn } from '@/lib/utils'

export interface Pill {
  kasus: Kasus | null
  label: string
}

/** The cases a frame marks, as pills. A preposition frame names the preposition. */
export function pillsOf(frame: Frame): Pill[] {
  if (frame.pattern === 'prep' && frame.prep && frame.prepCase) {
    return [{ kasus: frame.prepCase, label: `${frame.prep} + ${KASUS_LABEL[frame.prepCase]}` }]
  }
  switch (frame.pattern) {
    case 'dat':
      return [{ kasus: 'dat', label: 'Dativ' }]
    case 'akk':
      return [{ kasus: 'akk', label: 'Akkusativ' }]
    case 'gen':
      return [{ kasus: 'gen', label: 'Genitiv' }]
    case 'dat+akk':
      return [
        { kasus: 'dat', label: 'Dativ' },
        { kasus: 'akk', label: 'Akkusativ' },
      ]
    case 'akk+gen':
      return [
        { kasus: 'akk', label: 'Akkusativ' },
        { kasus: 'gen', label: 'Genitiv' },
      ]
    default:
      return [{ kasus: 'akk', label: PATTERN_LABEL[frame.pattern] }]
  }
}

/** A solid pill in the case colour, so it passes contrast on any surface. */
export function KasusPill({ pill, className }: { pill: Pill; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap px-2 py-0.5 text-[14px] font-semibold',
        className,
      )}
      style={
        pill.kasus
          ? { background: KASUS_FILL[pill.kasus], color: KASUS_ON[pill.kasus] }
          : { background: 'var(--secondary)', color: 'var(--foreground)' }
      }
    >
      {pill.label}
    </span>
  )
}

/**
 * What the verb governs, with the meaning that frame carries. The English
 * matters most here: halten von and halten für are the same verb and different
 * words, so a pill on its own would say the case and hide the point.
 */
export function VerbFramesInline({ infinitive, className }: { infinitive: string; className?: string }) {
  const entries = valencyFor(infinitive)
  if (entries.length === 0) return null

  const rows = entries.flatMap((entry) =>
    entry.frames.map((frame) => ({
      pills: pillsOf(frame),
      // A single-frame verb has no per-frame sense, and its meaning is already
      // printed beside the infinitive, so repeating it would be noise.
      sense: frame.sense ?? (entry.frames.length > 1 ? entry.en : null),
    })),
  )

  return (
    <span className={cn('flex flex-col gap-1', className)}>
      {rows.map((row, i) => (
        <span key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {row.pills.map((pill) => (
            <KasusPill key={pill.label} pill={pill} />
          ))}
          {row.sense && <span className="text-[15px] text-foreground-soft">{row.sense}</span>}
        </span>
      ))}
    </span>
  )
}

/** The full picture: each frame with what it means and an example. */
export function VerbFrames({ infinitive, className }: { infinitive: string; className?: string }) {
  const entries = valencyFor(infinitive)
  if (entries.length === 0) return null

  return (
    <section className={cn('flex flex-col gap-2', className)}>
      <span className="eyebrow">Kasus und Präpositionen</span>
      <ul className="flex flex-col gap-2">
        {entries.flatMap((entry) =>
          entry.frames.map((frame, i) => {
            const pills = pillsOf(frame)
            const first = pills[0]?.kasus ?? null
            return (
              <li
                key={`${entry.id}-${i}`}
                className="flex flex-col gap-1.5 border-l-[5px] p-3"
                style={{
                  borderColor: first ? KASUS_FILL[first] : 'var(--rule)',
                  background: first ? kasusTint(first, 14) : undefined,
                }}
              >
                <span className="flex flex-wrap items-center gap-1.5">
                  {pills.map((pill) => (
                    <KasusPill key={pill.label} pill={pill} />
                  ))}
                  {frame.sense && (
                    <span className="text-[15px] text-foreground-soft">{frame.sense}</span>
                  )}
                </span>
                <span className="de text-[17px]" lang="de">
                  {frame.example.de}
                </span>
                <span className="text-[15px] italic text-foreground-soft">{frame.example.en}</span>
              </li>
            )
          }),
        )}
      </ul>
      {entries.some((entry) => entry.note) && (
        <p className="text-[15px] leading-relaxed text-foreground-soft">
          {entries.find((entry) => entry.note)?.note}
        </p>
      )}
    </section>
  )
}
