import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { LedgerHead } from '@/components/Ledger'
import { snapshotFilename } from '@/lib/backup'
import type { Persistence } from '@/store/progress'
import { TOPICS } from '@/data/nouns'
import { TENSES, TENSE_LABEL } from '@/engine/conjugate'
import type { Tense } from '@/engine/conjugate'
import { DETERMINERS } from '@/engine/grammar'
import type { Level } from '@/engine/grammar'
import { LEVELS, MODES, MODE_LABEL, poolFor } from '@/engine/questions'
import type { Mode } from '@/engine/questions'
import { useTheme } from '@/lib/theme'
import type { Theme } from '@/lib/theme'
import { useProgress } from '@/store/progress'
import { cn } from '@/lib/utils'

const SESSION_LENGTHS = [8, 12, 20, 30]

const PERSISTENCE_LABEL: Record<Persistence, string> = {
  granted: 'gesichert',
  denied: 'noch nicht gesichert',
  unsupported: 'nicht möglich',
}

/** Written per capability rather than per browser name, so it is true everywhere. */
const PERSISTENCE_NOTE: Record<Persistence, string> = {
  granted:
    'Your browser has marked it as persistent, so it survives even when the device runs low on space.',
  denied:
    'Your browser has not marked it as persistent yet. In Chrome, Edge and Firefox that happens once you have used the app a few times, or as soon as you install it.',
  unsupported:
    'Your browser does not offer persistent storage. Safari in particular deletes stored data for any site you have not opened in 7 days. Installing this to your home screen gives it its own counter of days used, which avoids that.',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const LEVEL_NOTE: Record<Level, string> = {
  A1: 'Everyday words, the common irregulars, no Genitiv',
  A2: 'Adds the rest of the A2 vocabulary and more strong verbs',
  B1: 'Adds the meaning-contrast verbs and the two-way prepositions',
  B2: 'Adds Genitiv prepositions and the rarer strong verbs',
  C1: 'Everything in the dataset',
}

function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 border px-3 text-[14px] transition-colors',
        active ? 'border-rule-strong bg-foreground text-background' : 'border-rule hover:bg-secondary',
        className,
      )}
    >
      {children}
    </button>
  )
}

function SettingRow({
  id,
  title,
  detail,
  checked,
  onChange,
}: {
  id: string
  title: string
  detail: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-rule py-3.5">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id} className="text-[16px] font-semibold">
          {title}
        </Label>
        <p className="max-w-prose text-[14px] leading-relaxed text-foreground-soft">{detail}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-1 shrink-0" />
    </div>
  )
}

export function SettingsPage() {
  const { settings, updateSettings, resetAll, resetMode, progress, storage, exportProgress, importProgress } =
    useProgress()
  const { theme, setTheme } = useTheme()
  const [notice, setNotice] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const importMode = useRef<'merge' | 'replace'>('merge')

  const pickFile = (mode: 'merge' | 'replace') => {
    importMode.current = mode
    setNotice(null)
    fileInput.current?.click()
  }
  // null = closed, 'all' = everything, otherwise the single trainer to clear.
  const [pending, setPending] = useState<Mode | 'all' | null>(null)

  const poolSizes = useMemo(
    () => MODES.map((mode) => ({ mode, size: poolFor(mode, settings).length })),
    [settings],
  )
  const total = poolSizes.reduce((sum, entry) => sum + entry.size, 0)

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  return (
    <div className="flex flex-col gap-10 pb-10">
      <section className="flex flex-col gap-4">
        <LedgerHead label="Niveau" right={`${total.toLocaleString('de-DE')} Karten`} />
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((level) => (
            <Chip
              key={level}
              active={settings.level === level}
              onClick={() => updateSettings({ level })}
            >
              {level}
            </Chip>
          ))}
        </div>
        <p className="text-[14px] text-foreground-soft">{LEVEL_NOTE[settings.level]}</p>
        <ul className="flex flex-col">
          {poolSizes.map(({ mode, size }) => (
            <li
              key={mode}
              className="flex items-baseline justify-between border-b border-rule py-2 text-[15px]"
            >
              <span>{MODE_LABEL[mode]}</span>
              <span className="tabular text-muted-foreground">{size.toLocaleString('de-DE')}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <LedgerHead label="Runde" />
        <div className="flex flex-wrap gap-1.5">
          {SESSION_LENGTHS.map((length) => (
            <Chip
              key={length}
              active={settings.sessionLength === length}
              onClick={() => updateSettings({ sessionLength: length })}
            >
              {length} Karten
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <LedgerHead label="Zeitformen" right={`${settings.tenses.length} von ${TENSES.length}`} />
        <p className="text-[14px] text-foreground-soft">
          Which tenses the verb drill asks for. The paradigm writer always offers all ten.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TENSES.map((tense) => (
            <Chip
              key={tense}
              active={settings.tenses.includes(tense)}
              onClick={() => {
                const next = toggle<Tense>(settings.tenses, tense)
                // An empty list would produce an empty deck.
                if (next.length > 0) updateSettings({ tenses: next })
              }}
            >
              {TENSE_LABEL[tense]}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <LedgerHead label="Determinative" right={`${settings.determiners.length} ausgewählt`} />
        <p className="text-[14px] text-foreground-soft">
          Which determiners can appear in the declension drill.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DETERMINERS.map((det) => (
            <Chip
              key={det.id}
              active={settings.determiners.includes(det.id)}
              onClick={() => {
                const next = toggle(settings.determiners, det.id)
                if (next.length > 0) updateSettings({ determiners: next })
              }}
            >
              {det.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <LedgerHead
          label="Wortfelder"
          right={settings.topics.length === 0 ? 'alle' : `${settings.topics.length} von ${TOPICS.length}`}
        />
        <div className="flex flex-wrap gap-1.5">
          <Chip active={settings.topics.length === 0} onClick={() => updateSettings({ topics: [] })}>
            alle
          </Chip>
          {TOPICS.map((topic) => (
            <Chip
              key={topic}
              active={settings.topics.includes(topic)}
              onClick={() => updateSettings({ topics: toggle(settings.topics, topic) })}
            >
              {topic}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <LedgerHead label="Schwierigkeit" />
        <SettingRow
          id="adjectives"
          title="Adjektive einbauen"
          detail="Adds an adjective to some noun phrases, so you have to get the adjective ending right as well."
          checked={settings.includeAdjectives}
          onChange={(includeAdjectives) => updateSettings({ includeAdjectives })}
        />
        <SettingRow
          id="plural"
          title="Plural einbauen"
          detail="Roughly a third of declension cards switch to the plural, which is where the dative -n lives."
          checked={settings.usePlural}
          onChange={(usePlural) => updateSettings({ usePlural })}
        />
      </section>

      <section className="flex flex-col gap-1">
        <LedgerHead label="Korrektur" />
        <SettingRow
          id="ascii"
          title="ae, oe, ue, ss zulassen"
          detail="Typing gaebe for gäbe counts as right, and the answer shows the proper spelling. A phone keyboard should not cost you marks."
          checked={settings.tolerateAsciiUmlauts}
          onChange={(tolerateAsciiUmlauts) => updateSettings({ tolerateAsciiUmlauts })}
        />
        <SettingRow
          id="case"
          title="Kleinschreibung zulassen"
          detail="Off by default: capitalisation is grammar in German, so dem kind counts as wrong."
          checked={settings.tolerateCase}
          onChange={(tolerateCase) => updateSettings({ tolerateCase })}
        />
      </section>

      <section className="flex flex-col gap-4">
        <LedgerHead label="Darstellung" />
        <div className="flex flex-wrap gap-1.5">
          {(['system', 'light', 'dark'] as Theme[]).map((option) => (
            <Chip key={option} active={theme === option} onClick={() => setTheme(option)}>
              {option === 'system' ? 'System' : option === 'light' ? 'Hell' : 'Dunkel'}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <LedgerHead label="Datensicherung" right={PERSISTENCE_LABEL[storage.persistence]} />

        <p className="max-w-prose text-[15px] leading-relaxed text-foreground-soft">
          Your progress lives in this browser only, and takes {formatBytes(storage.progressBytes)}.{' '}
          {PERSISTENCE_NOTE[storage.persistence]} Clearing site data deletes it either way, so export
          a copy now and then.
        </p>

        {storage.recovered && (
          <p className="border-l-[3px] border-wrong pl-3 text-[15px] leading-snug">
            The stored file could not be read on the last load, so an earlier copy was restored. The
            unreadable version was kept aside rather than deleted.
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            className="h-9"
            onClick={() => {
              exportProgress()
              setNotice(`Exported as ${snapshotFilename()}`)
            }}
          >
            Exportieren
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => pickFile('merge')}>
            Importieren und zusammenführen
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => pickFile('replace')}>
            Importieren und ersetzen
          </Button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            try {
              const added = importProgress(await file.text(), importMode.current)
              setNotice(
                importMode.current === 'replace'
                  ? 'Replaced your progress with the file.'
                  : `Merged. ${added} card${added === 1 ? '' : 's'} added, and any card reviewed more recently in the file now wins.`,
              )
            } catch (error) {
              setNotice(error instanceof Error ? error.message : 'That file could not be read.')
            }
          }}
        />

        {notice && (
          <p aria-live="polite" className="border-l-[3px] border-rule-strong pl-3 text-[15px] leading-snug">
            {notice}
          </p>
        )}

        <p className="max-w-prose text-[15px] leading-relaxed text-foreground-soft">
          Merging keeps whichever copy of each card was reviewed more recently, so your phone and
          your desktop can be merged in either order with the same result. Importing the same file
          twice changes nothing.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <LedgerHead
          label="Zurücksetzen"
          right={`${Object.keys(progress.cards).length.toLocaleString('de-DE')} Karten begonnen`}
        />
        <p className="max-w-prose text-[15px] leading-relaxed text-foreground-soft">
          Nothing here is automatic. Progress is only ever cleared when you clear it.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((mode) => (
            <Button
              key={mode}
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setPending(mode)}
            >
              {MODE_LABEL[mode]} zurücksetzen
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-destructive"
            onClick={() => setPending('all')}
          >
            Alles zurücksetzen
          </Button>
        </div>

        <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>
                {pending === 'all'
                  ? 'Alles zurücksetzen?'
                  : `${pending ? MODE_LABEL[pending] : ''} zurücksetzen?`}
              </DialogTitle>
              <DialogDescription>
                {pending === 'all'
                  ? 'This clears the schedule for every card, your streak and your totals. Your settings stay as they are, and there is no undo.'
                  : 'This clears the schedule for every card in this trainer. The cards come back as unseen, and there is no undo.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Abbrechen</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  if (pending === 'all') resetAll()
                  else if (pending) resetMode(pending)
                  setPending(null)
                }}
              >
                Zurücksetzen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <p className="border-t border-rule pt-4 text-[14px] leading-relaxed text-foreground-soft">
        Grammar generated from principal parts rather than typed out by hand, so every form comes
        from one rule in one place. A wrong form is a bug. Open an issue and it gets fixed for good.
      </p>
    </div>
  )
}
