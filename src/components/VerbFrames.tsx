import type { Frame } from '@/data/valency'
import { PATTERN_LABEL, valencyFor } from '@/data/valency'
import type { Kasus } from '@/engine/grammar'
import { KASUS_LABEL } from '@/engine/grammar'
import { KASUS_VAR, kasusTint } from '@/lib/kasus'
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
          ? { background: KASUS_VAR[pill.kasus], color: 'var(--background)' }
          : { background: 'var(--secondary)', color: 'var(--foreground)' }
      }
    >
      {pill.label}
    </span>
  )
}

/** One line of pills: what this verb governs, at a glance. */
export function VerbFramesInline({ infinitive, className }: { infinitive: string; className?: string }) {
  const entries = valencyFor(infinitive)
  if (entries.length === 0) return null
  const pills = entries.flatMap((entry) => entry.frames.flatMap(pillsOf))
  const seen = new Set<string>()
  const unique = pills.filter((p) => (seen.has(p.label) ? false : (seen.add(p.label), true)))

  return (
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      {unique.map((pill) => (
        <KasusPill key={pill.label} pill={pill} />
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
                  borderColor: first ? KASUS_VAR[first] : 'var(--rule)',
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
